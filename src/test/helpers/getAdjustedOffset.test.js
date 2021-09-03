import getAdjustedOffset from '../../helpers/getAdjustedOffset';

test('Adjusts a request\'s offset.', () => {
  expect(getAdjustedOffset(100)).toBe(80);
  expect(getAdjustedOffset(10)).toBe(0);
  expect(getAdjustedOffset(500, true)).toBe(250);
  expect(getAdjustedOffset(100, true)).toBe(0);
});
