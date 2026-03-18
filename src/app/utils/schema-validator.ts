/**
 * Lightweight CharaCardV3 Schema Validator
 *
 * Validates a parsed JSON object against the chara_card_v3 schema.
 * No external JSON Schema library needed — this is a focused, hand-written
 * validator matching exactly the spec §10.2 requirements.
 */

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateCharaCard(obj: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof obj !== 'object' || obj === null) {
    return { valid: false, errors: [{ path: '$', message: 'Card must be a non-null object.' }] };
  }

  const card = obj as Record<string, unknown>;

  // Spec header
  if (card['spec'] !== 'chara_card_v3') {
    errors.push({ path: '$.spec', message: `Expected "chara_card_v3", got "${String(card['spec'])}".` });
  }
  if (card['spec_version'] !== '3.0') {
    errors.push({ path: '$.spec_version', message: `Expected "3.0", got "${String(card['spec_version'])}".` });
  }

  // Data object
  if (typeof card['data'] !== 'object' || card['data'] === null) {
    errors.push({ path: '$.data', message: 'Missing or invalid "data" object.' });
    return { valid: false, errors };
  }

  const data = card['data'] as Record<string, unknown>;

  // Required string fields
  const requiredStrings = [
    'name', 'description', 'personality', 'scenario',
    'first_mes', 'mes_example', 'creator_notes', 'system_prompt',
    'post_history_instructions', 'character_version', 'creator',
  ];
  for (const field of requiredStrings) {
    if (typeof data[field] !== 'string') {
      errors.push({ path: `$.data.${field}`, message: `Required string field "${field}" is missing or not a string.` });
    }
  }

  // Required arrays
  if (!Array.isArray(data['tags'])) {
    errors.push({ path: '$.data.tags', message: '"tags" must be an array.' });
  }
  if (!Array.isArray(data['alternate_greetings'])) {
    errors.push({ path: '$.data.alternate_greetings', message: '"alternate_greetings" must be an array.' });
  }

  // Extensions must be an object
  if (typeof data['extensions'] !== 'object' || data['extensions'] === null) {
    errors.push({ path: '$.data.extensions', message: '"extensions" must be an object (use {} if empty).' });
  }

  // Optional: validate depth_prompt if present
  const ext = data['extensions'] as Record<string, unknown> | null;
  if (ext && typeof ext['depth_prompt'] === 'object' && ext['depth_prompt'] !== null) {
    const dp = ext['depth_prompt'] as Record<string, unknown>;
    if (typeof dp['prompt'] !== 'string') {
      errors.push({ path: '$.data.extensions.depth_prompt.prompt', message: '"prompt" must be a string.' });
    }
    if (typeof dp['depth'] !== 'number') {
      errors.push({ path: '$.data.extensions.depth_prompt.depth', message: '"depth" must be a number.' });
    }
    if (!['system', 'user', 'assistant'].includes(dp['role'] as string)) {
      errors.push({ path: '$.data.extensions.depth_prompt.role', message: '"role" must be "system", "user", or "assistant".' });
    }
  }

  // Optional: validate character_book if present
  if (data['character_book'] !== undefined) {
    validateLorebook(data['character_book'], errors);
  }

  return { valid: errors.length === 0, errors };
}

function validateLorebook(book: unknown, errors: ValidationError[]): void {
  if (typeof book !== 'object' || book === null) {
    errors.push({ path: '$.data.character_book', message: 'Lorebook must be an object.' });
    return;
  }

  const lb = book as Record<string, unknown>;

  if (!Array.isArray(lb['entries'])) {
    errors.push({ path: '$.data.character_book.entries', message: '"entries" must be an array.' });
    return;
  }

  for (let i = 0; i < lb['entries'].length; i++) {
    const entry = lb['entries'][i] as Record<string, unknown>;
    if (typeof entry !== 'object' || entry === null) {
      errors.push({ path: `$.data.character_book.entries[${i}]`, message: 'Entry must be an object.' });
      continue;
    }
    if (typeof entry['id'] !== 'number') {
      errors.push({ path: `$.data.character_book.entries[${i}].id`, message: '"id" must be a number.' });
    }
    if (!Array.isArray(entry['keys'])) {
      errors.push({ path: `$.data.character_book.entries[${i}].keys`, message: '"keys" must be an array.' });
    }
    if (typeof entry['content'] !== 'string') {
      errors.push({ path: `$.data.character_book.entries[${i}].content`, message: '"content" must be a string.' });
    }
    if (typeof entry['enabled'] !== 'boolean') {
      errors.push({ path: `$.data.character_book.entries[${i}].enabled`, message: '"enabled" must be a boolean.' });
    }
    if (typeof entry['insertion_order'] !== 'number') {
      errors.push({ path: `$.data.character_book.entries[${i}].insertion_order`, message: '"insertion_order" must be a number.' });
    }
  }
}
