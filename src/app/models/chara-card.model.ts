/**
 * TavernQuill — SillyTavern V3 Character Card Models
 *
 * These interfaces represent the chara_card_v3 schema as defined in the
 * TavernQuill spec (§3.2, §10). The `data` object is the canonical source
 * of truth; root-level fields are V2 legacy backfill written on export.
 */

// ── Core Card Interfaces ────────────────────────────────────────────────────

export interface CharaCardV3 {
  spec: 'chara_card_v3';
  spec_version: '3.0';
  data: CharaCardData;

  // V2 Legacy backfill (root-level). Written on export for backward compat.
  name?: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  mes_example?: string;
  avatar?: string;
  creatorcomment?: string;
  create_date?: string;
  talkativeness?: string;
  fav?: boolean;
  creator?: string;
  tags?: string[];
}

export interface CharaCardData {
  // Identity
  name: string;
  description: string;
  personality: string;
  scenario: string;

  // Dialogue
  first_mes: string;
  mes_example: string;

  // System
  system_prompt: string;
  post_history_instructions: string;
  creator_notes: string;

  // Metadata
  tags: string[];
  creator: string;
  character_version: string;
  created: number;   // Unix timestamp (ms)
  modified: number;  // Unix timestamp (ms)

  // Alternate greetings
  alternate_greetings: string[];

  // Extensions (frontend-specific)
  extensions: SillyTavernExtensions | Record<string, unknown>;

  // Lorebook (optional)
  character_book?: Lorebook;
}

// ── SillyTavern Extensions ──────────────────────────────────────────────────

export interface DepthPrompt {
  prompt: string;
  depth: number;
  role: 'system' | 'user' | 'assistant';
}

export interface SillyTavernExtensions {
  talkativeness?: string;
  fav?: boolean;
  world?: string;
  depth_prompt?: DepthPrompt;
  [key: string]: unknown;
}

// ── Lorebook Types ──────────────────────────────────────────────────────────

export interface Lorebook {
  name?: string;
  description?: string;
  entries: LorebookEntry[];
  extensions: Record<string, unknown>;
}

export interface LorebookEntry {
  id: number;
  keys: string[];
  content: string;
  enabled: boolean;
  insertion_order: number;
  case_sensitive?: boolean;
  comment?: string;
  extensions: Record<string, unknown>;
}

// ── Tokenizer Hook (Future) ────────────────────────────────────────────────

export interface TokenizerHook {
  countTokens(text: string): Promise<number>;
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createBlankCard(): CharaCardV3 {
  const now = Date.now();
  return {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: '',
      description: '',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      system_prompt: '',
      post_history_instructions: '',
      creator_notes: '',
      tags: [],
      creator: '',
      character_version: '',
      created: now,
      modified: now,
      alternate_greetings: [],
      extensions: {},
    },
  };
}

/**
 * Builds the full V3 export JSON, including V2 legacy backfill at root level.
 */
export function buildExportPayload(card: CharaCardV3): Record<string, unknown> {
  const ext = card.data.extensions as SillyTavernExtensions;
  return {
    // V2 legacy backfill
    name: card.data.name,
    description: card.data.description,
    personality: card.data.personality,
    scenario: card.data.scenario,
    first_mes: card.data.first_mes,
    mes_example: card.data.mes_example,
    avatar: 'none',
    creatorcomment: '',
    create_date: new Date(card.data.modified).toISOString(),
    talkativeness: ext?.talkativeness ?? '0.5',
    fav: ext?.fav ?? false,
    creator: card.data.creator,
    tags: card.data.tags,

    // V3 spec
    spec: card.spec,
    spec_version: card.spec_version,
    data: card.data,
  };
}
