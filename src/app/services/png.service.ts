import { Injectable, inject } from '@angular/core';
import {
  CharaCardV3,
  buildExportPayload,
  createBlankCard,
} from '../models/chara-card.model';
import { readCharaFromPng, writeCharaToPng } from './png-codec';
import { validateCharaCard } from '../utils/schema-validator';

export interface PngImportResult {
  card: CharaCardV3;
  isV2Upgrade: boolean;
  avatarBuffer: Uint8Array;
}

/**
 * PngService — Handles all binary PNG read/write operations.
 *
 * Currently runs on the main thread. The Worker file and message
 * interface are scaffolded; heavy ops will be migrated there once
 * the main-thread implementation is proven correct.
 */
@Injectable({ providedIn: 'root' })
export class PngService {
  /**
   * Read a character card from a PNG file.
   */
  async readChara(file: File): Promise<PngImportResult> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { json, isV2Upgrade } = readCharaFromPng(buffer);

    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('Character card data is not valid JSON.');
    }

    // Automatically upgrade to V3 structure on import (§4.2)
    // We use createBlankCard() as a template to ensure all required fields exist.
    const template = createBlankCard();
    
    if (isV2Upgrade || (typeof parsed === 'object' && parsed !== null && !parsed.spec)) {
      // It's a V2 card or raw data. Map V2 fields to the V3 data structure.
      const v2Data = (parsed && typeof parsed === 'object' && parsed.data) ? parsed.data : parsed;
      parsed = {
        ...template,
        data: {
          ...template.data,
          ...v2Data,
          // Handle specific renames or types if necessary
          tags: Array.isArray(v2Data.tags) ? v2Data.tags : [],
        }
      };
    } else {
      // It's already V3, but might be missing optional-but-required-by-schema fields
      parsed = {
        ...template,
        ...parsed,
        data: {
          ...template.data,
          ...parsed.data
        }
      };
    }

    // Fix missing depth_prompt role
    if (parsed.data?.extensions?.depth_prompt && !parsed.data.extensions.depth_prompt.role) {
      parsed.data.extensions.depth_prompt.role = 'system';
    }

    const validation = validateCharaCard(parsed);
    if (!validation.valid) {
      const messages = validation.errors.map(e => `${e.path}: ${e.message}`).join('\n');
      throw new Error(`Card validation failed:\n${messages}`);
    }

    const card = parsed as CharaCardV3;

    // Ensure data.extensions exists (spec requires it)
    if (!card.data.extensions) {
      card.data.extensions = {};
    }

    // Ensure timestamps exist
    if (!card.data.created) card.data.created = Date.now();
    if (!card.data.modified) card.data.modified = Date.now();

    return { card, isV2Upgrade, avatarBuffer: buffer };
  }

  /**
   * Write a character card back into a PNG file.
   *
   * DUAL-CHUNK WRITE (§3.1): Writes both ccv3 and chara tEXt chunks.
   */
  async writeChara(card: CharaCardV3, avatarBuffer: Uint8Array): Promise<Blob> {
    // Update modified timestamp
    card.data.modified = Date.now();

    // V3 JSON (for ccv3 chunk)
    const exportPayload = buildExportPayload(card);
    const v3JsonString = JSON.stringify(exportPayload);

    // V2-compatible JSON (for chara chunk backfill)
    const v2JsonString = JSON.stringify(exportPayload);

    const outputBuffer = writeCharaToPng(avatarBuffer, v3JsonString, v2JsonString);

    return new Blob([new Uint8Array(outputBuffer) as BlobPart], { type: 'image/png' });
  }

  /**
   * Export the character card as a JSON file.
   */
  async exportJson(card: CharaCardV3): Promise<Blob> {
    card.data.modified = Date.now();
    const exportPayload = buildExportPayload(card);
    const jsonString = JSON.stringify(exportPayload, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Ensures the returned array buffer is a valid PNG.
   * If the input file is not a PNG (e.g. JPEG), it converts it using a canvas.
   */
  async ensurePng(file: File): Promise<Uint8Array> {
    const buf = await file.arrayBuffer();
    const arr = new Uint8Array(buf);

    // Check PNG signature
    const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
    let isPng = arr.length >= 8;
    for (let i = 0; i < 8 && isPng; i++) {
      if (arr[i] !== PNG_SIGNATURE[i]) isPng = false;
    }

    if (isPng) {
      return arr;
    }

    // Convert via canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Failed to get 2d context for image conversion.'));
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Failed to convert image to PNG.'));
          blob.arrayBuffer()
            .then(b => resolve(new Uint8Array(b)))
            .catch(reject);
        }, 'image/png');
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for conversion.'));
      };
      img.src = URL.createObjectURL(file);
    });
  }
}
