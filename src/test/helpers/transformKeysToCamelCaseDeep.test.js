import transformKeysToCamelCaseDeep from '../../helpers/transformKeysToCamelCaseDeep';

describe('The transformKeysToCamelCaseDeep helper.', () => {
  test('Should return a shallow object with all keys transformed to camelCase.', () => {
    const inputObject = {
      test_key_1: null,
      test_key_2: null,
      test_key_3: null,
    };

    const outputObject = {
      testKey1: null,
      testKey2: null,
      testKey3: null,
    };

    expect(transformKeysToCamelCaseDeep(inputObject)).toStrictEqual(outputObject);
  });

  test('Should return a deep object with all keys transformed to camelCase.', () => {
    const inputObject = {
      test_key_1: null,
      test_key_2: null,
      test_key_3: {
        inner_test_key_1: null,
        inner_test_key_2: null,
        inner_test_key_3: null,
      },
    };

    const outputObject = {
      testKey1: null,
      testKey2: null,
      testKey3: {
        innerTestKey1: null,
        innerTestKey2: null,
        innerTestKey3: null,
      },
    };

    expect(transformKeysToCamelCaseDeep(inputObject)).toStrictEqual(outputObject);
  });
});
