import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import {
  CharaCardV3,
  CharaCardData,
  TokenizerHook,
  createBlankCard,
} from '../models/chara-card.model';

/**
 * EditorService — Central orchestrator for the active character card in memory.
 *
 * All state is signal-based. No FormsModule, no ReactiveFormsModule.
 */
@Injectable({ providedIn: 'root' })
export class EditorService {
  // ── State ────────────────────────────────────────────────────────────────

  /** The full card wrapper (spec + spec_version + data). */
  readonly card: WritableSignal<CharaCardV3> = signal(createBlankCard());

  /** The avatar image as a Uint8Array (original PNG binary). */
  readonly avatarBuffer: WritableSignal<Uint8Array | null> = signal(null);

  /** Object URL for avatar preview. */
  readonly avatarUrl: WritableSignal<string | null> = signal(null);

  /** Whether the current card was upgraded from V2 on import. */
  readonly isV2Upgrade: WritableSignal<boolean> = signal(false);

  /** Currently active chapter index (0–3). */
  readonly activeChapter: WritableSignal<number> = signal(0);

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Convenience accessor for card.data */
  readonly cardData = computed(() => this.card().data);

  /** Chapter 1 (Soul) completion: name is required. */
  readonly soulComplete = computed(() => {
    const d = this.card().data;
    return d.name.trim().length > 0;
  });

  /** Chapter 2 (Mind) completion: at least scenario or system_prompt filled. */
  readonly mindComplete = computed(() => {
    const d = this.card().data;
    return d.scenario.trim().length > 0 || d.system_prompt.trim().length > 0;
  });

  /** Chapter 3 (Voice) completion: first_mes is required. */
  readonly voiceComplete = computed(() => {
    const d = this.card().data;
    return d.first_mes.trim().length > 0;
  });

  /** Chapter 4 (Ghost) always "complete" (lorebook is optional). */
  readonly ghostComplete = computed(() => true);

  /** Overall card readiness for export. */
  readonly canExport = computed(() => {
    return this.soulComplete() && this.voiceComplete() && this.avatarBuffer() !== null;
  });

  /** Validation errors for display. */
  readonly validationErrors = computed<string[]>(() => {
    const errs: string[] = [];
    const d = this.card().data;
    if (!d.name.trim()) errs.push('Character name is required.');
    if (!d.first_mes.trim()) errs.push('At least one greeting (first message) is required.');
    if (!this.avatarBuffer()) errs.push('An avatar image (PNG) is required for export.');
    return errs;
  });

  // ── Tokenizer Hook ───────────────────────────────────────────────────────

  private tokenizerHook: TokenizerHook | null = null;

  registerTokenizer(hook: TokenizerHook): void {
    this.tokenizerHook = hook;
  }

  async countTokens(text: string): Promise<number | null> {
    if (!this.tokenizerHook) return null;
    return this.tokenizerHook.countTokens(text);
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Load a card from an imported payload. */
  loadCard(card: CharaCardV3, avatarBuffer: Uint8Array, isV2Upgrade: boolean): void {
    this.card.set(card);
    this.avatarBuffer.set(avatarBuffer);
    this.isV2Upgrade.set(isV2Upgrade);
    this.activeChapter.set(0);

    // Create object URL for preview
    this.revokeAvatarUrl();
    const blob = new Blob([new Uint8Array(avatarBuffer) as BlobPart], { type: 'image/png' });
    this.avatarUrl.set(URL.createObjectURL(blob));
  }

  /** Reset to a blank card. */
  resetToBlank(): void {
    this.card.set(createBlankCard());
    this.avatarBuffer.set(null);
    this.isV2Upgrade.set(false);
    this.activeChapter.set(0);
    this.revokeAvatarUrl();
  }

  /** Load a starter card from JSON (no avatar). */
  loadStarterCard(card: CharaCardV3): void {
    this.card.set(card);
    this.avatarBuffer.set(null);
    this.isV2Upgrade.set(false);
    this.activeChapter.set(0);
    this.revokeAvatarUrl();
  }

  /** Update a single field on card.data immutably. */
  updateField<K extends keyof CharaCardData>(field: K, value: CharaCardData[K]): void {
    this.card.update(c => ({
      ...c,
      data: { ...c.data, [field]: value, modified: Date.now() },
    }));
  }

  /** Set the avatar image. */
  setAvatar(buffer: Uint8Array): void {
    this.avatarBuffer.set(buffer);
    this.revokeAvatarUrl();
    const blob = new Blob([new Uint8Array(buffer) as BlobPart], { type: 'image/png' });
    this.avatarUrl.set(URL.createObjectURL(blob));
  }

  /** Navigate to a chapter. */
  setChapter(index: number): void {
    if (index >= 0 && index <= 3) {
      this.activeChapter.set(index);
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private revokeAvatarUrl(): void {
    const current = this.avatarUrl();
    if (current) {
      URL.revokeObjectURL(current);
      this.avatarUrl.set(null);
    }
  }
}
