import { Injectable, computed } from '@angular/core';
import { EditorService } from './editor.service';
import { Lorebook, LorebookEntry } from '../models/chara-card.model';

/**
 * LorebookService — Scoped service for accessing lorebook data.
 *
 * v1 Scope: Read-only. Parses and exposes lorebook entries from
 * the active card. No add/edit/delete.
 *
 * This service is the sole owner of Lorebook/LorebookEntry type usage.
 * No other service or component should import those types directly.
 */
@Injectable({ providedIn: 'root' })
export class LorebookService {
  constructor(private readonly editor: EditorService) {}

  /** Whether the current card has a lorebook. */
  readonly hasLorebook = computed<boolean>(() => {
    const book = this.editor.cardData().character_book;
    return !!book && Array.isArray(book.entries) && book.entries.length > 0;
  });

  /** The lorebook object (or null). */
  readonly lorebook = computed<Lorebook | null>(() => {
    return this.editor.cardData().character_book ?? null;
  });

  /** The lorebook entries. */
  readonly entries = computed<LorebookEntry[]>(() => {
    return this.lorebook()?.entries ?? [];
  });

  /** The lorebook name (if any). */
  readonly lorebookName = computed<string>(() => {
    return this.lorebook()?.name ?? '';
  });

  /** The lorebook description (if any). */
  readonly lorebookDescription = computed<string>(() => {
    return this.lorebook()?.description ?? '';
  });

  /** Count of enabled entries. */
  readonly enabledCount = computed<number>(() => {
    return this.entries().filter(e => e.enabled).length;
  });

  /** Total entry count. */
  readonly totalCount = computed<number>(() => {
    return this.entries().length;
  });
}
