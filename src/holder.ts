import {RequestChunk, ResponseChunk, WardenStream} from "./warden-stream";
import {TransformCallback} from "stream";
import {StreamType} from "./stream-factory";


class Holder extends WardenStream {
  private holdQueue: { [key: string]: RequestChunk[] | null } = {};

  constructor() {
    super(StreamType.HOLDER);
  }

  onResponse(chunk: ResponseChunk, callback: TransformCallback): void {
    const holdQueue = this.holdQueue[chunk.key];


    if (holdQueue) {
      holdQueue.forEach(holdChunk => {
        this.respond({
          ...chunk,
          cb: holdChunk.cb,
        });
      });

      delete this.holdQueue[chunk.key];
      callback(undefined, null);
    } else {
      callback(undefined, chunk);
    }
  }

  onRequest(chunk: RequestChunk, callback: TransformCallback): void {
    const holdQueue = this.holdQueue[chunk.key];

    if (holdQueue) {
      holdQueue.push(chunk);
      callback(undefined, null);
    } else {
      this.holdQueue[chunk.key] = [chunk];
      callback(undefined, chunk);
    }
  }
}

export {
  Holder
};
