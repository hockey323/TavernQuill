/**
 * PNG Worker Message Interface
 *
 * Scaffolded from day one so migrating heavy PNG operations
 * to a Web Worker is a refactor, not a restructure.
 */

export type PngWorkerRequest =
  | { type: 'READ_CHARA'; payload: ArrayBuffer }
  | { type: 'WRITE_CHARA'; payload: { cardJson: string; avatarBuffer: ArrayBuffer } };

export type PngWorkerResponse =
  | { type: 'READ_CHARA_RESULT'; payload: { json: string; isV2Upgrade: boolean } }
  | { type: 'WRITE_CHARA_RESULT'; payload: ArrayBuffer }
  | { type: 'ERROR'; payload: string };
