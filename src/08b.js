// @flow strict

import fs from 'fs';
import invariant from 'invariant';
import run from './lib/runner';
import { chunked, zipMany } from 'itertools';
import { parse } from './08a';

const W = 25;
const H = 6;
const LAYER_SIZE = W * H;

const WHITE_PIXEL = '░';
const BLACK_PIXEL = '▓';

type Pixel = number;
type Layer = Array<Pixel>;
type Image = Array<Layer>;

function drawPixel(pixel: Pixel) {
  if (pixel === 0) {
    process.stdout.write(BLACK_PIXEL);
  } else if (pixel === 1) {
    process.stdout.write(WHITE_PIXEL);
  } else {
    process.stdout.write(' '); // "transparent"
  }
}

function drawRow(pixels: Array<Pixel>) {
  for (const pixel of pixels) {
    drawPixel(pixel);
  }
  process.stdout.write('\n');
}

function drawLayer(layer: Layer) {
  const rows = chunked(layer, W);
  for (const row of rows) {
    drawRow(row);
  }
}

function merge(layers: Array<Layer>): Layer {
  const layer = [];
  for (const pixelStack of zipMany(...layers)) {
    layer.push(pixelStack.find(digit => digit === 0 || digit === 1) || 2);
  }
  return layer;
}

async function main() {
  const data = fs.readFileSync('./data/08.data.txt', 'utf-8');
  const img = parse(data);
  const layer = merge(img);
  drawLayer(layer);
}

if (require.main === module) {
  run(main);
}
