import camelCase from '../../helpers/camelCase';

describe('The camelCase helper.', () => {
  test('Should return a camelCase string, given a lowercase snake_case string.', () => {
    expect(camelCase('snake_case')).toBe('snakeCase');
  });

  test('Should return a camelCase string, given an uppercase snake_case string.', () => {
    expect(camelCase('SNAKE_CASE')).toBe('snakeCase');
  });

  test('Should return a camelCase string, given a lowercase kebab-case string.', () => {
    expect(camelCase('kebab-case')).toBe('kebabCase');
  });

  test('Should return a camelCase string, given an uppercase kebab-case string.', () => {
    expect(camelCase('KEBAB-CASE')).toBe('kebabCase');
  });

  test('Should return a camelCase string, given a lowercase string with spaces.', () => {
    expect(camelCase('string with spaces')).toBe('stringWithSpaces');
  });

  test('Should return a camelCase string, given an uppercase string with spaces.', () => {
    expect(camelCase('STRING WITH SPACES')).toBe('stringWithSpaces');
  });
});
