// @flow strict

import readline from 'readline';

export default function clearScreen() {
  const blank = '\n'.repeat(
    // $FlowFixMe
    process.stdout.rows
  );
  console.log(blank);
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}
