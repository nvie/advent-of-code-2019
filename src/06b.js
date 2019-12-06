// @flow strict

import fs from 'fs';
import type { Planet, OrbitParents } from './06a';
import { parse, hopCountTo } from './06a';

/**
 * Produces a chain of planets "parents", starting from `from`, all the way up
 * to CoM, e.g. [SAN, I, D, C, B, COM]
 */
function allParents(from: Planet, parents: OrbitParents): Array<Planet> {
  const parent = parents[from];
  if (!parent) {
    return [from];
  } else {
    return [from, ...allParents(parent, parents)];
  }
}

function findCommonAncestor(p1: Planet, p2: Planet, map: OrbitParents): Planet {
  const seen = new Set([...allParents(p1, map)]);
  const common = allParents(p2, map).find(parent => seen.has(parent));
  if (!common) {
    throw new Error(`No common ancestor found between ${p1} and ${p2}`);
  }
  return common;
}

/**
 * To find the distance between nodes, first find their common ancestor.
 *
 * [YOU, K, J, E, D, C, B, COM]
 * [SAN, I,       D, C, B, COM]
 *                ^
 *
 * From left to right, this is the first index in the list that they have in
 * common.  In this example, D.
 *
 * Then, the distance between both planets will be the sum of the distances to
 * their common (grand)parent.
 */
function distanceBetween(from: Planet, to: Planet, map: OrbitParents): number {
  const common: Planet = findCommonAncestor(from, to, map);
  return hopCountTo(from, common, map) + hopCountTo(to, common, map);
}

export async function main() {
  // const mapdata = fs.readFileSync('./data/06.example.data.txt', 'utf-8');
  const mapdata = fs.readFileSync('./data/06.data.txt', 'utf-8');
  const map = parse(mapdata);
  console.log(
    distanceBetween('YOU', 'SAN', map) -
      // NOTE: The "-2" here accounts for the "Between the objects they are
      // orbiting - not between YOU and SAN." part of the puzzle that
      // I completely overlooked *facepalm*
      2
  );
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(e => console.error(e) || process.exit(1));
}
