// @flow strict

import { cpu } from './puzzle-02-part1';

const prog =
  '1,0,0,3,1,1,2,3,1,3,4,3,1,5,0,3,2,9,1,19,1,19,5,23,1,23,5,27,2,27,10,31,1,31,9,35,1,35,5,39,1,6,39,43,2,9,43,47,1,5,47,51,2,6,51,55,1,5,55,59,2,10,59,63,1,63,6,67,2,67,6,71,2,10,71,75,1,6,75,79,2,79,9,83,1,83,5,87,1,87,9,91,1,91,9,95,1,10,95,99,1,99,13,103,2,6,103,107,1,107,5,111,1,6,111,115,1,9,115,119,1,119,9,123,2,123,10,127,1,6,127,131,2,131,13,135,1,13,135,139,1,9,139,143,1,9,143,147,1,147,13,151,1,151,9,155,1,155,13,159,1,6,159,163,1,13,163,167,1,2,167,171,1,171,13,0,99,2,0,14,0';
const basemem = prog.split(',').map(Number);

function bruteForce(): number {
  for (let noun = 0; noun < 100; noun++) {
    for (let verb = 0; verb < 100; verb++) {
      const mem = basemem.slice(); // copy base mem
      mem[1] = noun;
      mem[2] = verb;
      try {
        const output = cpu(mem);
        if (output[0] === 19690720) {
          // Found solution!
          return 100 * noun + verb;
        }
      } catch {
        // Ignore
      }
    }
  }
  throw new Error('Not found any result');
}

console.log(bruteForce());
