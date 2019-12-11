// @flow strict

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

export async function askNumber(): Promise<number> {
  do {
    const answer = Number(await ask('Enter a number: '));
    if (!isNaN(answer)) {
      return answer;
    }
  } while (true);
  throw new Error('Will never get here');
}
