import camelCase from '../../helpers/camelCase';

test('Converts a string to camelCase.', () => {
  expect(camelCase('foo_bar')).toBe('fooBar');
  expect(camelCase('FOO_BAR')).toBe('fooBar');
  expect(camelCase('foo-bar')).toBe('fooBar');
  expect(camelCase('FOO-BAR')).toBe('fooBar');
  expect(camelCase('foo bar')).toBe('fooBar');
  expect(camelCase('FOO BAR')).toBe('fooBar');
});
