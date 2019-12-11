// @flow strict

import fs from 'fs';
import invariant from 'invariant';
import run from './lib/runner';
import { min, chunked } from 'itertools';

const W = 25;
const H = 6;
const LAYER_SIZE = W * H;

type Pixel = number;
type Layer = Array<Pixel>;
type Image = Array<Layer>;

export function parse(data: string): Image {
  const bytes = data
    .trim()
    .split('')
    .map(Number);
  const numLayers = bytes.length / LAYER_SIZE;
  invariant(LAYER_SIZE, 'Unexpected wwwwwwww ' + LAYER_SIZE);
  invariant(Number.isInteger(numLayers), 'Invalid number of layers: ' + numLayers);

  return Array.from(chunked(bytes, LAYER_SIZE));
}

async function main() {
  const data = fs.readFileSync('./data/08.data.txt', 'utf-8');
  const img = parse(data);

  function numDigits(digit: number) {
    return (layer: Layer): number => layer.filter(byte => byte === digit).length;
  }

  // Find the layer with the fewest 0 digits
  const layer = min(img, numDigits(0));
  invariant(layer, 'No such layer found');

  console.log('layer   = ', layer);
  console.log('#1      = ', numDigits(1)(layer));
  console.log('#2      = ', numDigits(2)(layer));
  console.log('#1 * #2 = ', numDigits(1)(layer) * numDigits(2)(layer));
}

if (require.main === module) {
  run(main);
}
