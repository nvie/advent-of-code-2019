// @flow strict

import run from './lib/runner';
import { main as main11a } from './11a';

async function main() {
  await main11a(/* start on white panel */ true);
}

if (require.main === module) {
  run(main);
}
