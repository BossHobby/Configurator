import { settings } from "./settings";

export function promiseTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject("timeout");
    }, ms);
  });

  return Promise.race([timeout, promise]);
}

export class AsyncSemaphore {
  private promises = Array<() => void>();

  constructor(private permits: number) {}

  signal() {
    this.permits += 1;
    if (this.promises.length > 0) this.promises.pop()!();
  }

  async wait() {
    this.permits -= 1;
    if (this.permits < 0 || this.promises.length > 0)
      await new Promise<void>((r) => this.promises.unshift(r));
  }
}

const QUEUE_BUFFER_SIZE = settings.serial.bufferSize * 2;

export class AsyncQueue {
  private _promises: Promise<void>[] = [];
  private _resolvers: (() => void)[] = [];

  private _buffer = new Uint8Array(QUEUE_BUFFER_SIZE);
  private _head = 0;
  private _tail = 0;

  private _done?: Promise<void>;
  private _abort = new AbortController();

  constructor(private readable: ReadableStream, errorCallback: any) {
    this._done = readable
      .pipeTo(
        new WritableStream({
          write: this.write.bind(this),
        }),
        { signal: this._abort.signal }
      )
      .catch((err) => {
        if (err != "close") {
          errorCallback(err);
        }
      });
  }

  async close() {
    this._abort.abort("close");
    await this._done;
    this.readable.cancel();
  }

  private push(v: number, controller?: WritableStreamDefaultController) {
    const next = (this._head + 1) % QUEUE_BUFFER_SIZE;
    if (next == this._tail) {
      controller?.error("queue full");
      throw new Error("queue full");
    }

    this._buffer[next] = v;
    this._head = next;

    const fn = this._resolvers.shift();
    if (fn) fn();
  }

  private async write(
    array: Uint8Array,
    controller?: WritableStreamDefaultController
  ) {
    for (const v of array) {
      this.push(v, controller);
    }
  }

  private _add(): Promise<void> {
    if (!this._promises.length) {
      this._promises.push(
        new Promise((resolve) => {
          this._resolvers.push(resolve);
        })
      );
    }
    return this._promises.shift() || Promise.resolve();
  }

  async pop(): Promise<number> {
    if (this._head == this._tail) {
      return this._add().then(() => this.pop());
    }

    const tail = (this._tail + 1) % QUEUE_BUFFER_SIZE;
    const val = this._buffer[tail];
    this._tail = tail;
    return val;
  }

  async read(size: number): Promise<number[]> {
    const buffer: number[] = [];
    for (let i = 0; i < size; i++) {
      buffer.push(await this.pop());
    }
    return buffer;
  }
}
