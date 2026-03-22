/**
 * PNG Binary Codec
 *
 * Pure Uint8Array-based PNG chunk reader/writer.
 * No Canvas API. No external dependencies.
 *
 * Key spec requirements (§3.1):
 * - READ:  ccv3 chunk first, fallback to chara. Accept tEXt and iTXt defensively.
 * - WRITE: Two tEXt chunks — ccv3 (primary) AND chara (V2 backfill). Write only tEXt.
 * - CRC32 must be recalculated for all injected/modified chunks.
 * - Preserve all original chunks that are not ccv3 or chara.
 */

// ── PNG Signature ───────────────────────────────────────────────────────────

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

// ── CRC32 ───────────────────────────────────────────────────────────────────

const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ── Chunk Parsing ───────────────────────────────────────────────────────────

export interface PngChunk {
  type: string;
  data: Uint8Array;
  offset: number;       // byte offset in original file
  totalLength: number;  // 4 (length) + 4 (type) + data.length + 4 (crc)
}

/**
 * Parse a PNG file into its constituent chunks.
 */
export function parsePngChunks(buffer: Uint8Array): PngChunk[] {
  // Validate PNG signature
  for (let i = 0; i < 8; i++) {
    if (buffer[i] !== PNG_SIGNATURE[i]) {
      throw new Error('Invalid PNG file: signature mismatch.');
    }
  }

  const chunks: PngChunk[] = [];
  let offset = 8; // skip signature

  while (offset < buffer.length) {
    const dataLength = readUint32(buffer, offset);
    const typeBytes = buffer.slice(offset + 4, offset + 8);
    const type = String.fromCharCode(...typeBytes);
    const data = buffer.slice(offset + 8, offset + 8 + dataLength);
    const totalLength = 4 + 4 + dataLength + 4;

    chunks.push({ type, data, offset, totalLength });

    offset += totalLength;

    if (type === 'IEND') break;
  }

  return chunks;
}

/**
 * Read a Base64-encoded JSON payload from a tEXt or iTXt chunk.
 */
function readTextChunkPayload(chunk: PngChunk): string {
  const raw = chunk.data;

  if (chunk.type === 'tEXt') {
    // tEXt: keyword\0text
    const nullIndex = raw.indexOf(0);
    if (nullIndex === -1) throw new Error('Malformed tEXt chunk: missing null separator.');
    const textBytes = raw.slice(nullIndex + 1);
    return new TextDecoder('latin1').decode(textBytes);
  }

  if (chunk.type === 'iTXt') {
    // iTXt: keyword\0 compressionFlag\0 compressionMethod\0 languageTag\0 translatedKeyword\0 text
    let pos = raw.indexOf(0); // end of keyword
    if (pos === -1) throw new Error('Malformed iTXt chunk.');
    pos++; // skip null
    pos++; // skip compression flag
    pos++; // skip compression method
    // skip language tag
    pos = raw.indexOf(0, pos);
    if (pos === -1) throw new Error('Malformed iTXt chunk: missing language tag terminator.');
    pos++;
    // skip translated keyword
    pos = raw.indexOf(0, pos);
    if (pos === -1) throw new Error('Malformed iTXt chunk: missing translated keyword terminator.');
    pos++;
    const textBytes = raw.slice(pos);
    return new TextDecoder('utf-8').decode(textBytes);
  }

  throw new Error(`Unsupported chunk type for text reading: ${chunk.type}`);
}

/**
 * Get the keyword from a tEXt or iTXt chunk.
 */
function getChunkKeyword(chunk: PngChunk): string {
  const nullIndex = chunk.data.indexOf(0);
  if (nullIndex === -1) return '';
  return new TextDecoder('latin1').decode(chunk.data.slice(0, nullIndex));
}

// ── Reading ─────────────────────────────────────────────────────────────────

export interface PngReadResult {
  json: string;
  isV2Upgrade: boolean;
  chunks: PngChunk[];
}

/**
 * Extract the character card JSON from a PNG file.
 *
 * Priority: ccv3 chunk first, then chara fallback.
 * Accepts both tEXt and iTXt defensively.
 */
export function readCharaFromPng(buffer: Uint8Array): PngReadResult {
  const chunks = parsePngChunks(buffer);

  // Find text chunks with character data keywords
  const textChunks = chunks.filter(
    c => (c.type === 'tEXt' || c.type === 'iTXt') &&
         (getChunkKeyword(c) === 'ccv3' || getChunkKeyword(c) === 'chara')
  );

  // Prefer ccv3
  const ccv3Chunk = textChunks.find(c => getChunkKeyword(c) === 'ccv3');
  const charaChunk = textChunks.find(c => getChunkKeyword(c) === 'chara');

  if (ccv3Chunk) {
    const payload = readTextChunkPayload(ccv3Chunk);
    const json = decodePayload(payload);
    return { json, isV2Upgrade: false, chunks };
  }

  if (charaChunk) {
    const payload = readTextChunkPayload(charaChunk);
    const json = decodePayload(payload);
    return { json, isV2Upgrade: true, chunks };
  }

  throw new Error(
    'No character data found in this PNG. Expected a "ccv3" or "chara" metadata chunk.'
  );
}

/**
 * Handle smart decoding of the payload.
 * Tavern V2 cards are usually raw JSON (UTF-8); V3 cards are Base64 (UTF-8).
 */
function decodePayload(payload: string): string {
  try {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return payload; // Fallback to raw if not Base64
  }
}

/**
 * Unicode-safe Base64 encoding.
 */
function encodePayload(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ── Writing ─────────────────────────────────────────────────────────────────

/**
 * Build a tEXt chunk with the given keyword and Base64-encoded text.
 *
 * Chunk structure: [4-byte length][4-byte type][data][4-byte CRC]
 * tEXt data: keyword + \0 + text (Latin-1 encoded)
 */
function buildTextChunk(keyword: string, base64Text: string): Uint8Array {
  const keywordBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(base64Text);
  const dataLength = keywordBytes.length + 1 + textBytes.length; // +1 for null separator

  const chunk = new Uint8Array(4 + 4 + dataLength + 4);
  const view = new DataView(chunk.buffer);

  // Length (4 bytes, big-endian)
  view.setUint32(0, dataLength, false);

  // Type (4 bytes)
  const typeTag = new TextEncoder().encode('tEXt');
  chunk.set(typeTag, 4);

  // Data: keyword + \0 + text
  chunk.set(keywordBytes, 8);
  chunk[8 + keywordBytes.length] = 0; // null separator
  chunk.set(textBytes, 8 + keywordBytes.length + 1);

  // CRC (over type + data)
  const crcData = chunk.slice(4, 4 + 4 + dataLength);
  const crcValue = crc32(crcData);
  view.setUint32(4 + 4 + dataLength, crcValue, false);

  return chunk;
}

/**
 * Write character card data into a PNG file.
 *
 * CRITICAL: Writes BOTH ccv3 AND chara chunks (dual-chunk requirement, §3.1).
 * - ccv3: Full V3 JSON payload (Base64-encoded)
 * - chara: V2-compatible backfill (Base64-encoded)
 *
 * Preserves all original chunks except existing ccv3/chara chunks.
 * Injects new chunks before IEND.
 */
export function writeCharaToPng(
  originalBuffer: Uint8Array,
  v3JsonString: string,
  v2JsonString: string,
): Uint8Array {
  const chunks = parsePngChunks(originalBuffer);

  // Filter out existing ccv3 and chara chunks
  const preservedChunks = chunks.filter(c => {
    if (c.type !== 'tEXt' && c.type !== 'iTXt') return true;
    const keyword = getChunkKeyword(c);
    return keyword !== 'ccv3' && keyword !== 'chara';
  });

  // Build new tEXt chunks
  const ccv3Chunk = buildTextChunk('ccv3', encodePayload(v3JsonString));
  const charaChunk = buildTextChunk('chara', encodePayload(v2JsonString));

  // Reassemble: signature + all chunks (except IEND) + new chunks + IEND
  const iendChunk = preservedChunks.find(c => c.type === 'IEND');
  const otherChunks = preservedChunks.filter(c => c.type !== 'IEND');

  // Calculate total size
  let totalSize = 8; // PNG signature
  for (const chunk of otherChunks) {
    totalSize += chunk.totalLength;
  }
  totalSize += ccv3Chunk.length;
  totalSize += charaChunk.length;
  if (iendChunk) {
    totalSize += iendChunk.totalLength;
  }

  // Build output buffer
  const output = new Uint8Array(totalSize);
  let pos = 0;

  // PNG signature
  output.set(PNG_SIGNATURE, pos);
  pos += 8;

  // Original chunks (excluding ccv3, chara, IEND)
  for (const chunk of otherChunks) {
    const chunkBytes = originalBuffer.slice(chunk.offset, chunk.offset + chunk.totalLength);
    output.set(chunkBytes, pos);
    pos += chunk.totalLength;
  }

  // Inject ccv3 chunk
  output.set(ccv3Chunk, pos);
  pos += ccv3Chunk.length;

  // Inject chara chunk (V2 backfill)
  output.set(charaChunk, pos);
  pos += charaChunk.length;

  // IEND
  if (iendChunk) {
    const iendBytes = originalBuffer.slice(iendChunk.offset, iendChunk.offset + iendChunk.totalLength);
    output.set(iendBytes, pos);
  }

  return output;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function readUint32(data: Uint8Array, offset: number): number {
  return (
    ((data[offset] << 24) |
      (data[offset + 1] << 16) |
      (data[offset + 2] << 8) |
      data[offset + 3]) >>> 0
  );
}
