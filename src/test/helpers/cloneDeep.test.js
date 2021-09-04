import cloneDeep from '../../helpers/cloneDeep';

describe('The cloneDeep helper.', () => {
  const testArray = [
    1,
    2,
    3,
  ];

  const testObject = {
    deep: {
      foo: 'bar',
    },
    foo: 'bar',
  };

  test('Should return an array identical to testArray.', () => {
    expect(cloneDeep(testArray)).toStrictEqual(testArray);
  });

  test('Should return an array that is not testArray.', () => {
    expect(cloneDeep(testArray)).not.toBe(testArray);
  });

  test('Should return an object that is identical to testObject.', () => {
    expect(cloneDeep(testObject)).toStrictEqual(testObject);
  });

  test('Should return an object that is not testObject.', () => {
    expect(cloneDeep(testObject)).not.toBe(testObject);
  });
});
