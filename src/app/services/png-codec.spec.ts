import { describe, it, expect } from 'vitest';
import { crc32, parsePngChunks, readCharaFromPng } from './png-codec';

describe('PngCodec', () => {
  // 1. Test CRC32 (Standard PNG values)
  describe('crc32', () => {
    it('should calculate correct CRC32 for "test" payload', () => {
      const data = new TextEncoder().encode('test');
      expect(crc32(data)).toBe(0xd87f7e0c);
    });
  });

  // 2. Test PNG Parsing
  describe('parsePngChunks', () => {
    it('should throw error on invalid PNG signature', () => {
      const invalid = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
      expect(() => parsePngChunks(invalid)).toThrow('Invalid PNG file: signature mismatch.');
    });

    it('should parse a minimal valid PNG structure with chunks', () => {
      // Very simple, fake PNG buffer: signature (8) + IHDR (8+13+4) + IEND (8+0+4)
      const signature = [137, 80, 78, 71, 13, 10, 26, 10];
      const ihdr = [0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 0, 0, 0, 0]; // 13 bytes data + length/type/crc
      const iend = [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130];
      
      const buffer = new Uint8Array([...signature, ...ihdr, ...iend]);
      const chunks = parsePngChunks(buffer);

      expect(chunks.length).toBe(2);
      expect(chunks[0].type).toBe('IHDR');
      expect(chunks[1].type).toBe('IEND');
    });
  });

  // 3. Test Metadata Extraction
  describe('readCharaFromPng (Metadata)', () => {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    const iend = [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130];

    function createTextChunk(keyword: string, content: string): number[] {
      const keywordBytes = new TextEncoder().encode(keyword);
      const contentBytes = new TextEncoder().encode(content);
      const data = [...keywordBytes, 0, ...contentBytes];
      const length = data.length;
      
      const chunkPrefix = [
        (length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff,
        ...new TextEncoder().encode('tEXt')
      ];
      
      // CRC calculation (fake for test simplicity if not used by readChara)
      const crc = [0, 0, 0, 0]; 
      return [...chunkPrefix, ...data, ...crc];
    }

    it('should prioritize ccv3 chunk over chara', () => {
      const ccv3Json = btoa(JSON.stringify({ name: 'V3 Card' }));
      const charaJson = JSON.stringify({ name: 'V2 Card' }); // Non-base64 for V2
      
      const charaChunk = createTextChunk('chara', charaJson);
      const ccv3Chunk = createTextChunk('ccv3', ccv3Json);
      
      const buffer = new Uint8Array([...signature, ...charaChunk, ...ccv3Chunk, ...iend]);
      const result = readCharaFromPng(buffer);

      expect(result.isV2Upgrade).toBe(false);
      expect(JSON.parse(result.json).name).toBe('V3 Card');
    });

    it('should fallback to chara if ccv3 is missing', () => {
      const charaJson = JSON.stringify({ name: 'V2 Card' });
      const charaChunk = createTextChunk('chara', charaJson);
      
      const buffer = new Uint8Array([...signature, ...charaChunk, ...iend]);
      const result = readCharaFromPng(buffer);

      expect(result.isV2Upgrade).toBe(true);
      expect(JSON.parse(result.json).name).toBe('V2 Card');
    });

    it('should handle Base64-encoded chara chunk defensively', () => {
      const charaJson = btoa(JSON.stringify({ name: 'Base64 V2' }));
      const charaChunk = createTextChunk('chara', charaJson);
      
      const buffer = new Uint8Array([...signature, ...charaChunk, ...iend]);
      const result = readCharaFromPng(buffer);

      expect(JSON.parse(result.json).name).toBe('Base64 V2');
    });
  });
});
