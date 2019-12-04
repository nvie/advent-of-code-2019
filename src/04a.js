// @flow strict

import { count, reduce, ifilter, takewhile } from 'itertools';

const doubleRe = /(00|11|22|33|44|55|66|77|88|99)/;

/**
 * Produces an iterable (aka stream) of numbers between min and max, inclusive.
 */
function iterAll(min: number, max: number): Iterable<number> {
  return takewhile(count(min), n => n <= max);
}

/**
 * Defines the criteria for the password.  Although the input is a number, it's
 * easier to use string operations to determine the password criteria.
 */
function isCandidate(n: number): boolean {
  const s = String(n);

  // Number may not be decreasing
  for (let i = 0; i < 5; i++) {
    if (s[i] > s[i + 1]) return false;
  }

  // Must have two equal adjacent digits
  if (!doubleRe.test(s)) return false;

  return true;
}

/**
 * Produces a list of candidates matching the given predicate.
 */
export function allCandidates(
  min: number,
  max: number,
  pred: number => boolean
): Iterable<number> {
  return ifilter(iterAll(min, max), pred);
}

if (require.main === module) {
  const [min, max] = [245182, 790572];
  const candidates = Array.from(allCandidates(min, max, isCandidate));
  console.log(Array.from(candidates));
  console.log('---------------------------');
  console.log(candidates.length);
}
