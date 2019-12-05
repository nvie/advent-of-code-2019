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

type Memory = Array<number>;

/**
 * Given a program, run it by executing the instruction at `ptr`, modifying the
 * `mem` object inline.
 */
export async function cpu(mem: Memory, ptr: number = 0): Promise<Memory> {
  const op = mem[ptr];
  const addr1 = mem[ptr + 1];
  const addr2 = mem[ptr + 2];
  const addr3 = mem[ptr + 3];

  const a = mem[addr1];
  const b = mem[addr2];
  let r;
  switch (op) {
    case 1:
      mem[addr3] = a + b;
      return cpu(mem, ptr + 4);
    case 2:
      mem[addr3] = a * b;
      return cpu(mem, ptr + 4);
    case 99:
      // Halt normally
      return mem;
    default:
      console.error('mem = ' + mem.join(','));
      console.error('ptr = ' + ptr);
      console.error('1202 - unknown instruction', mem[ptr]);
      process.exit(2);
      throw new Error('1202');
  }
}

export async function run(input: string): Promise<string> {
  const mem = input.split(',').map(Number);
  return (await cpu(mem, 0)).join(',');
}

if (require.main === module) {
  const TEST_PROGRAM =
    '1,0,0,3,1,1,2,3,1,3,4,3,1,5,0,3,2,9,1,19,1,19,5,23,1,23,5,27,2,27,10,31,1,31,9,35,1,35,5,39,1,6,39,43,2,9,43,47,1,5,47,51,2,6,51,55,1,5,55,59,2,10,59,63,1,63,6,67,2,67,6,71,2,10,71,75,1,6,75,79,2,79,9,83,1,83,5,87,1,87,9,91,1,91,9,95,1,10,95,99,1,99,13,103,2,6,103,107,1,107,5,111,1,6,111,115,1,9,115,119,1,119,9,123,2,123,10,127,1,6,127,131,2,131,13,135,1,13,135,139,1,9,139,143,1,9,143,147,1,147,13,151,1,151,9,155,1,155,13,159,1,6,159,163,1,13,163,167,1,2,167,171,1,171,13,0,99,2,0,14,0';
  run(TEST_PROGRAM)
    .then(output => console.log(output) || process.exit(0))
    .catch(e => console.error(e) || process.exit(1));
}
