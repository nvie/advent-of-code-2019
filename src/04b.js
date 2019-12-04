// @flow strict

import { allCandidates } from './04a';

/**
 * Defines the new criteria for the password.  Although the input is a number,
 * it's easier to use string operations to determine the password criteria.
 */
function isCandidate(n: number): boolean {
  const s = String(n);

  // Number may not be decreasing
  for (let i = 0; i < 5; i++) {
    if (s[i] > s[i + 1]) return false;
  }

  // Must have at least one group of exactly two equal adjacent digits.  To
  // find this, we iterate over the string left to right, and compute the
  // length of each group we find.  If we find a new digit, we reset the
  // counter.  If upon resetting the group counter is 2, or the final count is
  // 2, then we found a match and we can immediately return it as a match.
  let counter = 1; // Counts the number of adjacent matches
  for (let i = 0; i < 5; i++) {
    // If two numbers are adjacent, then we increase the counter
    if (s[i] === s[i + 1]) {
      counter++;
    } else {
      // We need to reset our counter
      if (counter === 2) break; // Don't even bother, we have a match!
      counter = 1;
    }
  }

  return counter === 2;
}

if (require.main === module) {
  const [min, max] = [245182, 790572];
  const candidates = Array.from(allCandidates(min, max, isCandidate));
  console.log(Array.from(candidates));
  console.log('---------------------------');
  console.log(candidates.length);
}
