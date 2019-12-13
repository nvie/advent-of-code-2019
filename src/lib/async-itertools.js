// @flow strict

import type { Predicate } from 'itertools';

export async function aiter<T>(iterable: AsyncIterable<T>): AsyncIterator<T> {
  // $FlowFixMe
  return iterable[Symbol.asyncIterator]();
}

export async function* ifilter<T>(
  iterable: AsyncIterable<T>,
  predicate: Predicate<T>
): AsyncIterable<T> {
  for await (const value of iterable) {
    if (predicate(value)) {
      yield value;
    }
  }
}

export async function* chunked<T>(
  iterable: AsyncIterable<T>,
  size: number
): AsyncIterable<Array<T>> {
  const it: AsyncIterator<T> = await aiter(iterable);
  let r1 = await it.next();
  if (r1.done) {
    return;
  }

  let chunk = [r1.value];

  for await (const item of it) {
    chunk.push(item);

    if (chunk.length === size) {
      yield chunk;
      chunk = [];
    }
  }

  // Yield the remainder, if there is any
  if (chunk.length > 0) {
    yield chunk;
  }
}
