// @flow strict

import fs from 'fs';
import invariant from 'invariant';
import run from './lib/runner';
import { max, permutations } from 'itertools';

// '#' | '.'
type Grid = Array<Array<string>>;

export type XY = {|
  x: number,
  y: number,
|};

export type Ratio = {|
  dx: number,
  dy: number,
|};

/**
 * Reads a raw Grid array (aka the "visual representation") and returns the XY
 * coordinates for all asteroids, and the grid size.
 */
export function parseGrid(mapdata: string): {| asteroids: Array<XY>, gridsize: XY |} {
  const raw = mapdata
    .trim()
    .split('\n')
    .map(line => line.split(''));

  const size = {
    x: raw[0].length,
    y: raw.length,
  };

  const asteroids = [];
  for (let y = 0; y < size.y; ++y) {
    for (let x = 0; x < size.x; ++x) {
      if (raw[y][x] === '#') {
        asteroids.push({ x, y });
      }
    }
  }
  return { asteroids, gridsize: size };
}

export function serializeXY(c: XY): string {
  return `${c.x},${c.y}`;
}

export function subtract<T>(s1: Set<T>, s2: Set<T>): Set<T> {
  return new Set(Array.from(s1).filter(x => !s2.has(x)));
}

function pairs<T>(lut: { [string]: T }): Array<[string, T]> {
  const rv = [];
  for (const key of Object.keys(lut)) {
    const value = lut[key];
    rv.push([key, value]);
  }
  return rv;
}

/**
 * Greatest common divisor, using Euclid's algorithm.
 */
function gcd(a: number, b: number): number {
  invariant(
    a !== 0 && b !== 0,
    `gcd() only works with positive values, got (a=${a}, b=${b})`
  );
  if (a < 0 || b < 0) return gcd(Math.abs(a), Math.abs(b));
  if (a < b) return gcd(b, a);

  const remainder = a % b;
  return remainder === 0 ? b : gcd(b, remainder);
}

/**
 * Simplify ratio.
 */
function simplify(ratio: Ratio): Ratio {
  invariant(ratio.dx !== 0 || ratio.dy !== 0, 'Both cannot be 0');

  if (ratio.dx === 0) return { dx: 0, dy: ratio.dy < 0 ? -1 : 1 };
  if (ratio.dy === 0) return { dx: ratio.dx < 0 ? -1 : 1, dy: 0 };

  const base = gcd(ratio.dx, ratio.dy);
  return { dx: ratio.dx / base, dy: ratio.dy / base };
}

/**
 * Computes the discrete coefficients, or slope, of the line between the two
 * given points.  Discrete here means they will only be integers, not floating
 * point values.
 *
 * You can consider this the "steps" to take to find the next grid point that's
 * blocked by the line of sight.
 */
export function coeff(from: XY, coord: XY): Ratio {
  const dx = coord.x - from.x;
  const dy = coord.y - from.y;
  return simplify({ dx, dy });
}

/**
 * Generates all "black spots", given:
 *
 * - from: The observer's coordinate
 * - coord: The target asteroid, blocking the view beyond it
 * - gridsize: the grid's dimensions (space is finite here)
 */
function* iterBlackspots(from: XY, coord_: XY, gridsize: XY): Generator<XY, void, void> {
  let coord = { ...coord_ };
  const step = coeff(from, coord);
  while (true) {
    coord = {
      x: coord.x + step.dx,
      y: coord.y + step.dy,
    };

    if (coord.x < 0 || coord.x >= gridsize.x || coord.y < 0 || coord.y >= gridsize.y) {
      // Don't look beyond the grid
      return;
    }

    yield coord;
  }
}

async function main() {
  const mapdata = fs.readFileSync('./data/10-asteroids.txt', 'utf-8');
  const { asteroids, gridsize } = parseGrid(mapdata);

  const asteroidLocations = new Set(asteroids.map(serializeXY));

  const blackspotsByAsteroid = {};

  // Try every permutation of asteroids, comparing each asteroid as a base to
  // some other asteroid
  for (const [base, cmp] of permutations(asteroids, 2)) {
    // Iterate through all the black spots for this asteroid, and if an
    // asteroid exists at that coordinate, then count it as a miss
    const blackspots = new Set(
      Array.from(iterBlackspots(base, cmp, gridsize)).map(serializeXY)
    );

    // Now count the number of asteroids we can see by subtracting all the asteroids
    const key = serializeXY(base);
    const value =
      blackspotsByAsteroid[key] ||
      // The initial value for all visible asteroids is everything other than
      // itself.  We'll keep subtracting blackspots from this set.
      subtract(asteroidLocations, new Set([serializeXY(base)]));
    blackspotsByAsteroid[key] = subtract(value, blackspots);
  }

  const mx = max(pairs(blackspotsByAsteroid), ([k, v]) => v.size);
  invariant(mx, 'Should have one');
  const [k, v] = mx;
  console.log(`coord ${k} sees the maximum number of asteroids: ${v.size}`);
}

if (require.main === module) {
  run(main);
}
