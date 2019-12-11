// @flow strict

import invariant from 'invariant';
import { askNumber } from './askInput';

type Memory = Array<number>;
type Mode = 'POSITIONAL' | 'IMMEDIATE' | 'RELATIVE';

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
 * Given a program, run it by executing instruction starting at position 0,
 * modifying the `mem` instance inline.
 */
export default async function cpu(mem: Memory): Promise<void> {
  let rbase = 0;
  let ptr = 0;

  function get(addr: number): number {
    invariant(!isNaN(addr), 'addr must be a number');
    invariant(addr >= 0, 'addr must be positive');
    return mem[addr] || 0;
  }

  // Loop infinitely, until we hit a HALT instruction
  while (true) {
    const instruction = get(ptr);
    const opcode = instruction % 100;

    /**
     * Given an instruction and an argument index, returns the read mode to use
     * for that argument.
     */
    function getMode(idx: number): Mode {
      const bit = digit(
        instruction,
        idx + 2 /* skip 2 for the rightmost opcode digits */
      );
      switch (bit) {
        case 0:
          return 'POSITIONAL';
        case 1:
          return 'IMMEDIATE';
        case 2:
          return 'RELATIVE';
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
      const value = get(addr);
      const mode = getMode(idx);
      switch (mode) {
        case 'IMMEDIATE':
          return value;
        case 'RELATIVE':
          return get(value + rbase);
        // case 'POSITIONAL':
        default:
          return get(value);
      }
    }

    /**
     * Writes a value to argument location `n` (zero-indexed).
     */
    function put(idx: number, value: number) {
      invariant(!isNaN(idx), 'idx is not a number');
      invariant(!isNaN(value), 'value is not a number');

      const mode = getMode(idx);
      invariant(mode !== 'IMMEDIATE', 'Mode cannot be immediate for writes');

      const loc = ptr + idx + 1;
      let outaddr = get(loc);
      if (mode === 'RELATIVE') {
        outaddr += rbase;
      }

      const len = mem.length;
      if (outaddr >= len) {
        // Grow the memory, fill with 0's
        mem.length = outaddr;
        mem.fill(0, len);
        mem[outaddr] = value;
      }
      mem[outaddr] = value;
    }

    switch (opcode) {
      // Add
      case 1: {
        const a = read(0);
        const b = read(1);
        put(2, a + b);
        ptr += 4;
        continue;
      }

      // Multiply
      case 2: {
        const a = read(0);
        const b = read(1);
        const c = a * b;
        put(2, a * b);
        ptr += 4;
        continue;
      }

      // Ask input
      case 3:
        put(0, await askNumber());
        ptr += 2;
        continue;

      // Console output
      case 4:
        // Just prints a value as a side-effect and goes to the next instruction
        console.log('out: ' + read(0));
        ptr += 2;
        continue;

      // Jump-if-true
      case 5: {
        const cmp = read(0);

        // Compute the next ptr (either set it to the provided location, or
        // advance as normal)
        ptr = cmp !== 0 ? read(1) : ptr + 3;
        continue;
      }

      // Jump-if-false
      case 6: {
        const cmp = read(0);

        // Compute the next ptr (either set it to the provided location, or
        // advance as normal)
        ptr = cmp === 0 ? read(1) : ptr + 3;
        continue;
      }

      // Less than
      case 7: {
        const a = read(0);
        const b = read(1);
        put(2, a < b ? 1 : 0);
        ptr += 4;
        continue;
      }

      // Equal
      case 8: {
        const a = read(0);
        const b = read(1);
        put(2, a === b ? 1 : 0);
        ptr += 4;
        continue;
      }

      // Increase relative base
      case 9: {
        rbase += read(0);
        ptr += 2;
        continue;
      }

      // Halt normally
      case 99:
        return;

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
}
