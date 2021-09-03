/** @return {string} */
function camelCase(string) {
  return string
    .toLowerCase()
    .replace(/[-_ ]./g, (match) => match.charAt(1).toUpperCase());
}

export default camelCase;
