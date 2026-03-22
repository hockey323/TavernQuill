import { InjectionToken } from '@angular/core';

/**
 * Centralized i18n resource — en-CA (Canadian English)
 *
 * All user-facing strings are defined here to facilitate future translation.
 * Injected via Angular DI using the I18N token.
 *
 * NOTE: All sub-objects use explicit properties (not Record<string, string>)
 * to satisfy noPropertyAccessFromIndexSignature in strict Angular templates.
 */

export interface I18nFields {
  name: string;
  description: string;
  personality: string;
  tags: string;
  creator: string;
  character_version: string;
  scenario: string;
  system_prompt: string;
  post_history_instructions: string;
  creator_notes: string;
  first_mes: string;
  mes_example: string;
  alternate_greetings: string;
  talkativeness: string;
  depth_prompt: string;
}

export interface I18nActions {
  import: string;
  export_png: string;
  export_json: string;
  new_card: string;
  load_starter: string;
  toggle_theme: string;
  add_greeting: string;
  remove_greeting: string;
  upload_avatar: string;
  download: string;
  next_chapter: string;
  prev_chapter: string;
}

export interface I18nErrors {
  name_required: string;
  first_mes_required: string;
  avatar_required: string;
  invalid_png: string;
  no_chara_data: string;
  validation_failed: string;
  import_error: string;
}

export interface I18nMisc {
  v2_upgrade_warning: string;
  lorebook_coming_soon: string;
  lorebook_entries: string;
  no_lorebook: string;
  drop_hint: string;
  card_preview: string;
  chapter_complete: string;
  chapter_incomplete: string;
  starter_assistant: string;
  starter_wanderer: string;
  starter_blank: string;
}

export interface I18nStrings {
  app: {
    title: string;
    subtitle: string;
  };
  chapters: {
    soul: { title: string; subtitle: string };
    mind: { title: string; subtitle: string };
    voice: { title: string; subtitle: string };
    ghost: { title: string; subtitle: string };
  };
  fields: I18nFields;
  actions: I18nActions;
  errors: I18nErrors;
  misc: I18nMisc;
}

export const I18N = new InjectionToken<I18nStrings>('I18N');

export const EN_CA: I18nStrings = {
  app: {
    title: 'TavernQuill',
    subtitle: 'SillyTavern V3 Card Architect',
  },
  chapters: {
    soul: { title: 'Soul', subtitle: 'Identity & Personality' },
    mind: { title: 'Mind', subtitle: 'Scenario & Context' },
    voice: { title: 'Voice', subtitle: 'Dialogue & Greetings' },
    ghost: { title: 'Ghost', subtitle: 'World Info & Lorebook' },
  },
  fields: {
    name: 'Character Name',
    description: 'Description',
    personality: 'Personality Summary',
    tags: 'Tags',
    creator: 'Creator',
    character_version: 'Character Version',
    scenario: 'Scenario',
    system_prompt: 'System Prompt',
    post_history_instructions: 'Post-History Instructions',
    creator_notes: 'Creator Notes',
    first_mes: 'First Message (Greeting)',
    mes_example: 'Example Dialogue',
    alternate_greetings: 'Alternate Greetings',
    talkativeness: 'Talkativeness',
    depth_prompt: 'Depth Prompt',
  },
  actions: {
    import: 'Import PNG',
    export_png: 'Export PNG',
    export_json: 'Export JSON',
    new_card: 'New Card',
    load_starter: 'Load Starter',
    toggle_theme: 'Toggle Theme',
    add_greeting: 'Add Greeting',
    remove_greeting: 'Remove',
    upload_avatar: 'Upload Avatar',
    download: 'Download PNG',
    next_chapter: 'Next',
    prev_chapter: 'Back',
  },
  errors: {
    name_required: 'Character name is required.',
    first_mes_required: 'At least one greeting (first message) is required.',
    avatar_required: 'An avatar image (PNG) is required for export.',
    invalid_png: 'This file does not appear to be a valid PNG image.',
    no_chara_data: 'No character data found in this PNG.',
    validation_failed: 'Card validation failed.',
    import_error: 'Failed to import card.',
  },
  misc: {
    v2_upgrade_warning: 'This card was imported from V2 format and will be upgraded to V3 on export.',
    lorebook_coming_soon: 'Lorebook Editor — Coming Soon',
    lorebook_entries: 'Lorebook Entries',
    no_lorebook: 'No lorebook data in this card.',
    drop_hint: 'Drag & drop a PNG character card here, or click to browse.',
    card_preview: 'Card Preview',
    chapter_complete: 'Complete',
    chapter_incomplete: 'Incomplete',
    starter_assistant: 'The Assistant',
    starter_wanderer: 'The Wanderer',
    starter_blank: 'Blank Slate',
  },
};
