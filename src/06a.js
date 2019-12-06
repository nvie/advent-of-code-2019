// @flow strict

import fs from 'fs';

export type Planet = string;
export type LUT<T> = { [Planet]: T };

// Stores "parents", e.g. { [planet]: parent }
export type OrbitParents = LUT<Planet>;

const lineRe = /^(.+)\)(.+)$/;

export function parseLine(line: string): [Planet, Planet] {
  const match = line.trim().match(lineRe);
  if (!match) throw new Error(`Could not understand line ${line}`);
  const [, center, orb] = match;
  return [center, orb];
}

export function parse(input: string): OrbitParents {
  const map: OrbitParents = {};
  const lines = input.split('\n').filter(Boolean);
  for (const line of lines) {
    const [center, orb] = parseLine(line);
    map[orb] = center;
  }
  return map;
}

const sum = (items: Array<number>): number => items.reduce((cur, nxt) => cur + nxt, 0);

export function hopCountTo(from: Planet, to: Planet, parents: OrbitParents): number {
  if (from === to) {
    // Already there
    return 0;
  }

  // "Make a hop" and count it
  return 1 + hopCountTo(parents[from], to, parents);
}

export async function main() {
  // const mapdata = fs.readFileSync('./data/06.example.data.txt', 'utf-8');
  const mapdata = fs.readFileSync('./data/06.data.txt', 'utf-8');
  const map = parse(mapdata);

  const hops =
    // Get the number of direct/indirect orbits per planet, basically the
    // number of nodes on the traced line between it and the CoM
    Object.keys(map).map(planet => hopCountTo(planet, 'COM', map));

  console.log(sum(hops));
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(e => console.error(e) || process.exit(1));
}
