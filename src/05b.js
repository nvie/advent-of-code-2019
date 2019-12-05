// @flow strict

import invariant from 'invariant';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function input(): Promise<number> {
  do {
    const answer = Number(await ask('Enter a number: '));
    if (!isNaN(answer)) {
      return answer;
    }
  } while (true);
  throw new Error('Will never get here');
}

type Memory = Array<number>;

type Mode = 'POSITIONAL' | 'IMMEDIATE';

/**
 * Returns the "digit" at a location in the instruction.  Locations are
 * right-to-left indexes into the base-10 number.  For example:
 *
 *    digit(371, 0) -> 1
 *    digit(371, 1) -> 7
 *    digit(371, 2) -> 3
 *    digit(371, 3) -> 0
 *
 */
function digit(n: number, idx: number): number {
  return Math.floor(n / 10 ** idx) % 10;
}

/**
 * Given a program, run it by executing the instruction at `ptr`, modifying the
 * `mem` object inline.
 */
export async function cpu(mem: Memory, ptr: number = 0): Promise<Memory> {
  const instruction = mem[ptr];

  /**
   * Given an instruction and an argument index, returns the read mode to use
   * for that argument.
   */
  function mode(idx: number): Mode {
    const bit = digit(instruction, idx + 2 /* skip 2 for the rightmost opcode digits */);
    switch (bit) {
      case 0:
        return 'POSITIONAL';
      case 1:
        return 'IMMEDIATE';
      default:
        throw new Error(`Unexpected digit ${bit} at index ${idx} in "${instruction}"`);
    }
  }

  /**
   * Reads the "argument" to an opcode.  Zero-based, so arg(0) would return the
   * first argument to an opcode.  Depending on the mode, returns the immediate
   * value of the argument's memory location, or "resolves" it (positional).
   */
  function read(idx: number): number {
    const addr = ptr + idx + 1;
    const value = mem[addr];
    return mode(idx) === 'IMMEDIATE' ? value : mem[value];
  }

  /**
   * Writes a value to argument location `n` (zero-indexed).
   */
  function put(n: number, value: number) {
    const loc = ptr + n + 1;
    const outaddr = mem[loc];
    if (outaddr >= mem.length) {
      throw new Error('Buffer overflow');
    }
    mem[outaddr] = value;
  }

  const opcode = instruction % 100;
  switch (opcode) {
    // Add
    case 1: {
      const a = read(0);
      const b = read(1);
      put(2, a + b);
      return cpu(mem, ptr + 4);
    }

    // Multiply
    case 2: {
      const a = read(0);
      const b = read(1);
      const c = a * b;
      put(2, a * b);
      return cpu(mem, ptr + 4);
    }

    // Ask input
    case 3:
      put(0, await input());
      return cpu(mem, ptr + 2);

    // Console output
    case 4:
      // Just prints a value as a side-effect and goes to the next instruction
      console.log('out: ' + read(0));
      return cpu(mem, ptr + 2);

    // Jump-if-true
    case 5: {
      const cmp = read(0);

      // Compute the next ptr (either set it to the provided location, or
      // advance as normal)
      const next = cmp !== 0 ? read(1) : ptr + 3;
      return cpu(mem, next);
    }

    // Jump-if-false
    case 6: {
      const cmp = read(0);

      // Compute the next ptr (either set it to the provided location, or
      // advance as normal)
      const next = cmp === 0 ? read(1) : ptr + 3;
      return cpu(mem, next);
    }

    // Less than
    case 7: {
      const a = read(0);
      const b = read(1);
      put(2, a < b ? 1 : 0);
      return cpu(mem, ptr + 4);
    }

    // Equal
    case 8: {
      const a = read(0);
      const b = read(1);
      put(2, a === b ? 1 : 0);
      return cpu(mem, ptr + 4);
    }

    // Halt normally
    case 99:
      return mem;

    default:
      console.error('mem = ' + mem.join(','));
      console.error('ptr = ' + ptr);
      console.error('instruction = ' + instruction);
      console.error('opcode = ' + opcode);
      console.error('1202 - unknown opcode', opcode);
      process.exit(2);
      throw new Error('1202');
  }
}

export async function run(input: string): Promise<string> {
  const mem = input.split(',').map(Number);
  return (await cpu(mem, 0)).join(',');
}

if (require.main === module) {
  // const example = '3,21,1008,21,8,20,1005,20,22,107,8,21,20,1006,20,31,1106,0,36,98,0,0,1002,21,125,20,4,20,1105,1,46,104,999,1105,1,46,1101,1000,1,20,4,20,1105,1,46,98,99';
  const TEST_PROGRAM =
    // '1101,100,-1,4,0';
    // '1002,4,3,4,33';
    // '1,0,0,3,1,1,2,3,1,3,4,3,1,5,0,3,2,9,1,19,1,19,5,23,1,23,5,27,2,27,10,31,1,31,9,35,1,35,5,39,1,6,39,43,2,9,43,47,1,5,47,51,2,6,51,55,1,5,55,59,2,10,59,63,1,63,6,67,2,67,6,71,2,10,71,75,1,6,75,79,2,79,9,83,1,83,5,87,1,87,9,91,1,91,9,95,1,10,95,99,1,99,13,103,2,6,103,107,1,107,5,111,1,6,111,115,1,9,115,119,1,119,9,123,2,123,10,127,1,6,127,131,2,131,13,135,1,13,135,139,1,9,139,143,1,9,143,147,1,147,13,151,1,151,9,155,1,155,13,159,1,6,159,163,1,13,163,167,1,2,167,171,1,171,13,0,99,2,0,14,0';
    '3,225,1,225,6,6,1100,1,238,225,104,0,1101,90,64,225,1101,15,56,225,1,14,153,224,101,-147,224,224,4,224,1002,223,8,223,1001,224,3,224,1,224,223,223,2,162,188,224,101,-2014,224,224,4,224,1002,223,8,223,101,6,224,224,1,223,224,223,1001,18,81,224,1001,224,-137,224,4,224,1002,223,8,223,1001,224,3,224,1,223,224,223,1102,16,16,224,101,-256,224,224,4,224,1002,223,8,223,1001,224,6,224,1,223,224,223,101,48,217,224,1001,224,-125,224,4,224,1002,223,8,223,1001,224,3,224,1,224,223,223,1002,158,22,224,1001,224,-1540,224,4,224,1002,223,8,223,101,2,224,224,1,223,224,223,1101,83,31,225,1101,56,70,225,1101,13,38,225,102,36,192,224,1001,224,-3312,224,4,224,1002,223,8,223,1001,224,4,224,1,224,223,223,1102,75,53,225,1101,14,92,225,1101,7,66,224,101,-73,224,224,4,224,102,8,223,223,101,3,224,224,1,224,223,223,1101,77,60,225,4,223,99,0,0,0,677,0,0,0,0,0,0,0,0,0,0,0,1105,0,99999,1105,227,247,1105,1,99999,1005,227,99999,1005,0,256,1105,1,99999,1106,227,99999,1106,0,265,1105,1,99999,1006,0,99999,1006,227,274,1105,1,99999,1105,1,280,1105,1,99999,1,225,225,225,1101,294,0,0,105,1,0,1105,1,99999,1106,0,300,1105,1,99999,1,225,225,225,1101,314,0,0,106,0,0,1105,1,99999,7,226,677,224,1002,223,2,223,1005,224,329,1001,223,1,223,1007,226,677,224,1002,223,2,223,1005,224,344,101,1,223,223,108,226,226,224,1002,223,2,223,1006,224,359,101,1,223,223,7,226,226,224,102,2,223,223,1005,224,374,101,1,223,223,8,677,677,224,1002,223,2,223,1005,224,389,1001,223,1,223,107,677,677,224,102,2,223,223,1006,224,404,101,1,223,223,1107,677,226,224,102,2,223,223,1006,224,419,1001,223,1,223,1008,226,226,224,1002,223,2,223,1005,224,434,1001,223,1,223,7,677,226,224,102,2,223,223,1006,224,449,1001,223,1,223,1107,226,226,224,1002,223,2,223,1005,224,464,101,1,223,223,1108,226,677,224,102,2,223,223,1005,224,479,101,1,223,223,1007,677,677,224,102,2,223,223,1006,224,494,1001,223,1,223,1107,226,677,224,1002,223,2,223,1005,224,509,101,1,223,223,1007,226,226,224,1002,223,2,223,1006,224,524,101,1,223,223,107,226,226,224,1002,223,2,223,1005,224,539,1001,223,1,223,1108,677,677,224,1002,223,2,223,1005,224,554,101,1,223,223,1008,677,226,224,102,2,223,223,1006,224,569,1001,223,1,223,8,226,677,224,102,2,223,223,1005,224,584,1001,223,1,223,1008,677,677,224,1002,223,2,223,1006,224,599,1001,223,1,223,108,677,677,224,102,2,223,223,1006,224,614,1001,223,1,223,108,226,677,224,102,2,223,223,1005,224,629,101,1,223,223,8,677,226,224,102,2,223,223,1005,224,644,101,1,223,223,107,677,226,224,1002,223,2,223,1005,224,659,101,1,223,223,1108,677,226,224,102,2,223,223,1005,224,674,1001,223,1,223,4,223,99,226';
  run(TEST_PROGRAM)
    .then(output => console.log(output) || process.exit(0))
    .catch(e => console.error(e) || process.exit(1));
}
