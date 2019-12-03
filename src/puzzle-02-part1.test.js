import { run } from './puzzle-02-part1';

describe('puzzle2', () => {
  it('examples', () => {
    expect(run('1,0,0,0,99')).toBe('2,0,0,0,99');
    expect(run('2,3,0,3,99')).toBe('2,3,0,6,99');
    expect(run('2,4,4,5,99,0')).toBe('2,4,4,5,99,9801');
    expect(run('1,1,1,4,99,5,6,0,99')).toBe('30,1,1,4,2,5,6,0,99');
  });
});
