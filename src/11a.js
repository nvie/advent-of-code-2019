// @flow strict

import clear from './lib/clearScreen';
import cpu from './lib/intcode';
import fs from 'fs';
import invariant from 'invariant';
import run from './lib/runner';
import util from 'util';
import { chunked, min, max } from 'itertools';

const sleep = util.promisify(setTimeout);

type XY = string; // like '2,4' or '-3,0'
type Direction = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';
type Point = {| x: number, y: number |};
type Color = 'BLACK' | 'WHITE';
type Action = 'MOVE' | 'PAINT';

function minmax(items) {
  return [min(items) || 0, max(items) || 0];
}

function toPoint(xy: XY): Point {
  const [x, y] = xy.split(',').map(Number);
  return { x, y };
}

function toXY(p: Point): XY {
  return `${p.x},${p.y}`;
}

class Robot {
  // Records the current position.  We don't know how big, or even what shape,
  // the surface is, so we just start on (0, 0).
  current: Point;
  direction: Direction;

  // Record which panels have which color
  panels: Map<XY, Color>;

  constructor() {
    this.direction = 'NORTH';
    this.current = { x: 0, y: 0 };
    this.panels = new Map();
  }

  getColor(xy: XY): Color {
    return this.panels.get(xy) || 'BLACK';
  }

  readColor(): number {
    return this.getColor(toXY(this.current)) === 'BLACK' ? 0 : 1;
  }

  paint(color: Color) {
    this.panels.set(toXY(this.current), color);
  }

  turnRight() {
    const direction = this.direction;
    this.direction =
      direction === 'NORTH'
        ? 'EAST'
        : direction === 'EAST'
        ? 'SOUTH'
        : direction === 'SOUTH'
        ? 'WEST'
        : 'NORTH';
  }

  turnLeft() {
    // Feeling lazy...
    this.turnRight();
    this.turnRight();
    this.turnRight();
  }

  forward() {
    let { x, y } = this.current;
    switch (this.direction) {
      case 'NORTH':
        this.current = { x, y: y - 1 };
        return;
      case 'SOUTH':
        this.current = { x, y: y + 1 };
        return;
      case 'EAST':
        this.current = { x: x + 1, y };
        return;
      case 'WEST':
        this.current = { x: x - 1, y };
        return;
      default:
        throw new Error(`Invalid direction: ${this.direction}`);
    }
  }

  /**
   * Draws the current state on screen.
   */
  visualize() {
    clear();

    const direction = this.direction;

    // Compute a range of the grid to display.  Since we don't know how big the
    // area is that's going to be painted, we'll just scan the list of panels
    // we *know* were painted, and add 2 more space tiles on the edges.
    const [minX, maxX] = minmax(Array.from(this.panels.keys()).map(xy => toPoint(xy).x));
    const [minY, maxY] = minmax(Array.from(this.panels.keys()).map(xy => toPoint(xy).y));

    for (let y = minY - 2; y <= maxY + 2; ++y) {
      for (let x = minX - 2; x <= maxX + 2; ++x) {
        const point = { x, y };
        const xy = toXY(point);

        if (this.current.x === point.x && this.current.y === point.y) {
          process.stdout.write(
            direction === 'NORTH'
              ? '^'
              : direction === 'SOUTH'
              ? 'v'
              : direction === 'EAST'
              ? '>'
              : '<'
          );
        } else {
          const color = this.getColor(xy);
          process.stdout.write(color === 'BLACK' ? ' ' : '#');
        }
      }
      process.stdout.write('\n');
    }

    // console.log({ minX, maxX, minY, maxY, keys: Array.from(this.panels.keys()) });
  }
}

export async function main(startOnWhitePanel: boolean = false) {
  const program = fs.readFileSync('./data/11-robot-painter.txt', 'utf-8');
  const mem = program.split(',').map(Number);

  const robot = new Robot();
  robot.visualize();

  if (startOnWhitePanel) {
    // For 11b, the initial start panel is expected to be WHITE
    robot.paint('WHITE');
  }

  // Instantiate the brain now, hooking up the required input instruction to
  // the eyes of the robot, so it can read the color of the current panel.
  // It won't start yet until we start to consume from this generator.
  const brains = cpu(mem, () => robot.readColor());

  // Now we can start consuming from the CPU and receive instructions, until it
  // halts.  Since move/paint instructions are received interleaved, we'll need
  // to keep a mode state around to interpret them correctly.
  let mode: Action = 'PAINT';
  for await (const instruction of brains) {
    if (mode === 'PAINT') {
      const color = instruction === 0 ? 'BLACK' : 'WHITE';
      robot.paint(color);
    } else {
      if (instruction === 0) {
        robot.turnLeft();
      } else {
        robot.turnRight();
      }
      robot.forward();
    }

    // Toggle the instruction
    mode = mode === 'PAINT' ? 'MOVE' : 'PAINT';

    // Re-paint the screen to visualize what's going on
    // console.log(`Just handled instruction ${mode}): ${instruction}`);
    // await sleep(50);
  }

  robot.visualize();
  console.log(robot.panels.size, 'panels were painted');
}

if (require.main === module) {
  run(main);
}
