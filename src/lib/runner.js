// @flow strict

export default function runner(mainFn: () => Promise<void>): Promise<void> {
  return mainFn()
    .then(() => process.exit(0))
    .catch(e => console.error(e) || process.exit(1));
}
