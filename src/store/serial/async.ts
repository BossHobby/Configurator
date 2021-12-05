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

export class AsyncQueue {
  private _promises: Promise<number>[] = [];
  private _resolvers: ((t: number) => void)[] = [];

  constructor() { }

  close() {
  }

  private _add() {
    this._promises.push(new Promise(resolve => {
      this._resolvers.push(resolve);
    }));
  }

  push(v: number) {
    if (!this._resolvers.length)
      this._add();
    const resolve = this._resolvers.shift()!;
    resolve(v);
  }

  async pop(): Promise<number> {
    if (!this._promises.length)
      this._add();

    return await this._promises.shift()!;
  }

  async write(array: Uint8Array) {
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

