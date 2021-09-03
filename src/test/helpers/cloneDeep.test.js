import cloneDeep from '../../helpers/cloneDeep';

test('Clones an object deeply', () => {
  const testArray = [1, 2, 3];
  const testObject = {
    deep: {
      foo: 'bar',
    },
    foo: 'bar',
  };

  expect(cloneDeep(testArray)).toStrictEqual(testArray);
  expect(cloneDeep(testArray)).not.toBe(testArray);
  expect(cloneDeep(testObject)).toStrictEqual(testObject);
  expect(cloneDeep(testObject)).not.toBe(testObject);
});
