// @flow strict

import clear from './lib/clearScreen';
import cpu from './lib/intcode';
import fs from 'fs';
import invariant from 'invariant';
import run from './lib/runner';
import util from 'util';
import { enumerate, permutations, takewhile, chunked, min, max } from 'itertools';

type Position = {|
  x: number,
  y: number,
  z: number,
|};

type Velocity = {|
  dx: number,
  dy: number,
  dz: number,
|};

function velocityDelta(self: number, other: number): number {
  return self === other ? 0 : self < other ? 1 : -1;
}

class Moon {
  position: Position;
  velocity: Velocity;

  constructor(position: Position, velocity?: Velocity) {
    this.position = position;
    this.velocity = velocity || { dx: 0, dy: 0, dz: 0 };
  }

  applyGravityPull(other: Moon) {
    this.velocity = {
      dx: this.velocity.dx + velocityDelta(this.position.x, other.position.x),
      dy: this.velocity.dy + velocityDelta(this.position.y, other.position.y),
      dz: this.velocity.dz + velocityDelta(this.position.z, other.position.z),
    };
  }

  move() {
    this.position = {
      x: this.position.x + this.velocity.dx,
      y: this.position.y + this.velocity.dy,
      z: this.position.z + this.velocity.dz,
    };
  }

  potentialEnergy(): number {
    return (
      Math.abs(this.position.x) + Math.abs(this.position.y) + Math.abs(this.position.z)
    );
  }

  kineticEnergy(): number {
    return (
      Math.abs(this.velocity.dx) + Math.abs(this.velocity.dy) + Math.abs(this.velocity.dz)
    );
  }

  energy(): number {
    return this.kineticEnergy() * this.potentialEnergy();
  }

  /**
   * Most compact way of storing this Moon's state.
   */
  serialize(): string {
    return [
      this.position.x,
      this.position.y,
      this.position.z,
      this.velocity.dx,
      this.velocity.dy,
      this.velocity.dz,
    ].join(':');
  }

  toString() {
    const pot = this.potentialEnergy();
    const kin = this.kineticEnergy();

    const pos = `(${String(this.position.x).padStart(3, ' ')}, ${String(
      this.position.y
    ).padStart(3, ' ')}, ${String(this.position.z).padStart(3, ' ')})`;
    const vel = `(${String(this.velocity.dx).padStart(3, ' ')}, ${String(
      this.velocity.dy
    ).padStart(3, ' ')}, ${String(this.velocity.dz).padStart(3, ' ')})`;

    return `pos=${pos.padStart(15, ' ')}, vel=${vel}, pot=${String(pot).padStart(
      5,
      ' '
    )}, kin=${String(kin).padStart(5, ' ')}, energy=${pot * kin}`;
  }
}

/**
 * Performs one time tick. (We need to do 1000 of this.)
 */
function step(moons: Array<Moon>): Array<Moon> {
  // First update all velocities
  for (const [self, other] of permutations(moons, 2)) {
    self.applyGravityPull(other);
  }

  // Then all positions
  for (const moon of moons) {
    moon.move();
  }

  return moons;
}

function simulate(moons: Array<Moon>, numSteps: number): Array<Moon> {
  console.log('Start:');
  console.log(moons.map(String).join('\n'));
  console.log('');

  for (let i = 0; i < numSteps; ++i) {
    step(moons);
  }

  console.log(`After ${numSteps} steps:`);
  console.log(moons.map(String).join('\n'));
  console.log('');
  return moons;
}

function totalEnergy(moons: Array<Moon>): number {
  return moons.reduce((acc, cur) => acc + cur.energy(), 0);
}

async function main() {
  // // Example 1
  // console.log(
  //   totalEnergy(
  //     simulate(
  //       [
  //         new Moon({ x: -1, y: 0, z: 2 }),
  //         new Moon({ x: 2, y: -10, z: -7 }),
  //         new Moon({ x: 4, y: -8, z: 8 }),
  //         new Moon({ x: 3, y: 5, z: -1 }),
  //       ],
  //       10
  //     )
  //   )
  // );

  // // Example 2
  // console.log(
  //   totalEnergy(
  //     simulate(
  //       [
  //         new Moon({ x: -8, y: -10, z: 0 }),
  //         new Moon({ x: 5, y: 5, z: 10 }),
  //         new Moon({ x: 2, y: -7, z: 3 }),
  //         new Moon({ x: 9, y: -8, z: -3 }),
  //       ],
  //       100
  //     )
  //   )
  // );

  // Real puzzle input
  const moons = [
    new Moon({ x: -13, y: 14, z: -7 }),
    new Moon({ x: -18, y: 9, z: 0 }),
    new Moon({ x: 0, y: -3, z: -3 }),
    new Moon({ x: -15, y: 3, z: -13 }),
  ];

  console.log('Total energy:');
  console.log(totalEnergy(simulate(moons, 1000)));
}

if (require.main === module) {
  run(main);
}
