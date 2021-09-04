import getAdjustedOffset from '../../helpers/getAdjustedOffset';

describe('The getAdjustedOffset helper.', () => {
  test('Should return the original offset minus 20 (when the bulk argument is false).', () => {
    expect(getAdjustedOffset(100)).toBe(80);
  });

  test('Should return the original offset minus 250 (when the bulk argument is true).', () => {
    expect(getAdjustedOffset(500, true)).toBe(250);
  });

  test('Should return 0 if the adjusted offset would otherwise be negative.', () => {
    expect(getAdjustedOffset(10)).toBe(0);
  });
});
