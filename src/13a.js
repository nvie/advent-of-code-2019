// @flow strict

import cpu from './lib/intcode';
import fs from 'fs';
import invariant from 'invariant';
import run from './lib/runner';
import { askNumber } from './lib/askInput';
import { ifilter, chunked } from './lib/async-itertools';

// 0 = empty
// 1 = wall
// 2 = block
// 3 = horizontal paddle
// 4 = ball
type TileID = number;

const WALL = 1;
const BLOCK = 2;
const HORIZONTAL_PADDLE = 3;
const BALL = 4;

type Tile = {|
  x: number,
  y: number,
  tileid: TileID,
|};

async function* runGame(): AsyncGenerator<Tile, void, void> {
  const input = fs.readFileSync('./data/13-game.txt', 'utf-8');
  const mem = input.split(',').map(Number);
  for await (const [x, y, tileid] of chunked(cpu(mem), 3)) {
    yield { x, y, tileid };
  }
}

async function main() {
  let count = 0;
  for await (const tile of runGame()) {
    if (tile.tileid === BLOCK) {
      count++;
    }
  }
  console.log('number of block tiles:', count);
}

if (require.main === module) {
  run(main);
}
