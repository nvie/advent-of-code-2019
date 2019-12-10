// @flow strict

import fs from 'fs';
import invariant from 'invariant';
import {
  flatten,
  groupby,
  izipMany,
  max,
  permutations,
  roundrobin,
  sorted,
} from 'itertools';
import { parseGrid } from './10a';
import type { XY, Ratio } from './10a';

// Our found solution from 10a, hardcoded
const BASE = { x: 8, y: 16 };
//const BASE = { x: 1, y: 1 };

/**
 * Vaporizing happens clock-wise.  To make this easier, we'll treat each
 * "quarter" of the 2D space differently:
 *
 * - Top-right      [0, 90)
 * - Bottom-right   [90, 180)
 * - Bottom-left    [180, 270)
 * - Top-left       [270, 0)
 *
 * The values indicate the [inclusive, exclusive) bounds for each quarter.  So
 * at 90°, the bottom-right quarter starts.  We'll partition the list of
 * asteroids into these 4 buckets, and then repeatedly sweep our laser over
 * each bucket once.
 *
 * Within a quarter, we'll sweep the asteroids in this order:
 *
 * - Compute the "slope" of the asteroid compared to our BASE
 * - If multiple asteroids end up with the same slope, it means they're blocked
 *   by the line of sight, and in that case, compute the distance.  The closest
 *   asteroid "wins" (or... "loses" in the case of a giant laser being pointed
 *   at you, perhaps ¯\_(ツ)_/¯).
 *
 */
function* vaporize(asteroids: Array<XY>): Generator<XY, void, void> {
  // First, divide the entire grid into the four quarters
  // TR = top-right, BR = bottom-right, etc
  const TR = asteroids.filter(({ x, y }) => x >= BASE.x && y < BASE.y);
  const BR = asteroids.filter(({ x, y }) => x > BASE.x && y >= BASE.y);
  const BL = asteroids.filter(({ x, y }) => x <= BASE.x && y > BASE.y);
  const TL = asteroids.filter(({ x, y }) => x < BASE.x && y <= BASE.y);

  /**
   * This is where the magic all gets tied together.
   *
   * - Each sweep() call produces an iterator for that quarter.  Each iteration
   *   returns a *group* of asteroids that get vaporized *during the current
   *   sweep*.  For example, each quarter produces a list as follows:
   *
   *     [ [ (0,2), (2,2) ], [ (1,2), (2,3) ], [ (1,3) ] ]
   *       ^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^  ^^^^^^^^^
   *            Pass 1           Pass 2          Pass 3
   *
   * - The helper function allows the sweeper to translate the absolute
   *   coordinates in such a way that the X and Y coordinates will pivot around
   *   (0, 0) and are always positive.  This reduces the number of edge cases
   *   that sweep has to handle considerably.
   *
   * - Now that we can generate a list of "sweeps" for each quarter, we tie it
   *   all together, by roundrobin'ing all of them, until they're all
   *   exhausted.
   *
   *       Pass 1  Pass 1                  Pass 2  Pass 2
   *        (Q1)    (Q2)                    (Q1)    (Q2)
   *         |       |                       |       |
   *         v       v                       v       v
   *     [ [...],  [...], [...], [...],    [...],  [...], [...], [...],    ...]
   *       ^^^^^^^^^^^^^^^^^^^^^^^^^^^     ^^^^^^^^^^^^^^^^^^^^^^^^^^^
   *          Full-circle pass 1             Full-circle pass 2
   *
   * - All we have to do, is "flatten" this list, since this stream now
   *   provides the total ordering.
   *
   */
  yield* flatten(
    roundrobin(
      ...[
        sweeps(TR, rotate(3)),
        sweeps(BR, rotate(0)),
        sweeps(BL, rotate(1)),
        sweeps(TL, rotate(2)),
      ]
    )
  );
}

function distance(a: XY, b: XY): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  // Good ol' Pythagoras
  return Math.sqrt(dx * dx + dy * dy);
}

function rotateOnce(p: XY) {
  // Suppose BASE = (8, 3), and p = (11, 2).  This puts the value in the top
  // right corner.  We first compute the relative offset to the pivot point
  // BASE.  Then we rotate, then we add back the pivot point again.
  const dx = p.x - BASE.x;
  const dy = p.y - BASE.y;

  // Perform a clockwise rotation around the pivot point
  // (rdx = "dx after rotation")
  const rdx = -dy;
  const rdy = dx;
  return { x: BASE.x + rdx, y: BASE.y + rdy };
}

function rotate(times: number) {
  return (point: XY) => {
    let p = { ...point };
    for (let i = 0; i < times; ++i) {
      p = rotateOnce(p);
    }
    return p;
  };
}

function* iterLineOfSights(
  asteroids: Array<XY>,
  transformer: XY => XY
): Generator<Array<XY>, void, void> {
  function slope(asteroid: XY): number {
    const p = transformer(asteroid);
    const rp = { x: p.x - BASE.x, y: p.y - BASE.y };
    return rp.x === 0 ? 0 : rp.y / rp.x;
  }

  for (let [sl, asts] of groupby(sorted(asteroids, slope), slope)) {
    // Within this group, sort the asts by distance
    yield sorted(asts, xy => distance(BASE, xy));
  }
}

/**
 * Generates lists of items to wipe during this pass.  Every yielded unit is
 * a list of points to sweep during this pass over this quarter.
 */
function* sweeps(
  asts: Array<XY>,
  transformer: XY => XY
): Generator<Array<XY>, void, void> {
  yield* izipMany(...Array.from(iterLineOfSights(asts, transformer)));
}

async function main() {
  const mapdata = fs.readFileSync('./data/10-asteroids.txt', 'utf-8');
  const { asteroids, gridsize } = parseGrid(mapdata);

  const kabooms = Array.from(vaporize(asteroids));
  const winner = kabooms[199];
  console.log('The 200th zap is: ' + JSON.stringify(winner));
  console.log('The final answer is: ' + (winner.x * 100 + winner.y));
}

if (require.main === module) {
  main()
    .then(output => process.exit(0))
    .catch(e => console.error(e) || process.exit(1));
}
