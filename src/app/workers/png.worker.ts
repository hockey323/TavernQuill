/**
 * PNG Worker — Placeholder
 *
 * Currently scaffolded. Heavy PNG binary operations will be moved here
 * from PngService once the main-thread implementation is proven.
 */

/// <reference lib="webworker" />

import { PngWorkerRequest, PngWorkerResponse } from './png-worker.types';

addEventListener('message', ({ data }: MessageEvent<PngWorkerRequest>) => {
  try {
    switch (data.type) {
      case 'READ_CHARA':
        // TODO: Move PngCodec.readChara logic here
        postResponse({ type: 'ERROR', payload: 'Worker not yet implemented — use main-thread PngService.' });
        break;
      case 'WRITE_CHARA':
        // TODO: Move PngCodec.writeChara logic here
        postResponse({ type: 'ERROR', payload: 'Worker not yet implemented — use main-thread PngService.' });
        break;
    }
  } catch (e) {
    postResponse({ type: 'ERROR', payload: e instanceof Error ? e.message : String(e) });
  }
});

function postResponse(response: PngWorkerResponse): void {
  postMessage(response);
}
