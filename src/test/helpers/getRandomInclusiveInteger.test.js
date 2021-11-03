import getRandomInclusiveInteger from '../../helpers/getRandomInclusiveInteger';

describe('The getRandomInclusiveInteger helper.', () => {
  test('Should return the minimum when Math.random() returns 0 (or a really small number).', () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
    expect(getRandomInclusiveInteger(1, 10)).toBe(1);
  });

  test('Should return the maximum when Math.random() returns 0.999... (or a really large number).', () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.999);
    expect(getRandomInclusiveInteger(1, 10)).toBe(10);
  });
});
