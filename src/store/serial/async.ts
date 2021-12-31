export function promiseTimeout<T>(promise: PromiseLike<T>, ms: number): PromiseLike<T> {
  const timeout = new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject('timeout')
    }, ms)
  });

  return Promise.race([
    timeout,
    promise
  ]);
}

export class AsyncSemaphore {
  private promises = Array<() => void>()

  constructor(private permits: number) { }

  signal() {
    this.permits += 1
    if (this.promises.length > 0)
      this.promises.pop()!();
  }

  async wait() {
    this.permits -= 1
    if (this.permits < 0 || this.promises.length > 0)
      await new Promise<void>(r => this.promises.unshift(r));
  }
}


const QUEUE_BUFFER_SIZE = 8192;

export class AsyncQueue {
  private _promises: Promise<void>[] = [];
  private _resolvers: (() => void)[] = [];

  private _buffer = new Uint8Array(QUEUE_BUFFER_SIZE);
  private _head = 0;
  private _tail = 0;

  constructor() { }

  close() {
  }

  private _add() {
    this._promises.push(new Promise(resolve => {
      this._resolvers.push(resolve);
    }));
  }

  push(v: number) {
    const next = (this._head + 1) % QUEUE_BUFFER_SIZE;
    if (next == this._tail) {
      return;
    }

    this._buffer[next] = v;
    this._head = next;

    if (this._resolvers.length) {
      this._resolvers.shift()!();
    }
  }

  pop(): Promise<number> {
    if (this._head == this._tail) {
      if (!this._promises.length)
        this._add();

      return this
        ._promises
        .shift()!
        .then(() => this.pop());
    }
    this._tail = (this._tail + 1) % QUEUE_BUFFER_SIZE;
    return Promise.resolve(this._buffer[this._tail]);
  }

  write(array: Uint8Array) {
    for (const v of array) {
      this.push(v);
    }
  }

  async read(size: number): Promise<number[]> {
    const buffer: number[] = [];
    for (let i = 0; i < size; i++) {
      buffer.push(await this.pop());
    }
    return buffer;
  }
}

