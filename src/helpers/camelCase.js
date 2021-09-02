/** @return {string} */
function camelCase(string) {
  return string.replace(/-./ig, (match) => match.charAt(1).toUpperCase());
}

export default camelCase;
