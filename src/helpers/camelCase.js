/** @return {string} */
function camelCase(string) {
  return string.replace(/-./ig, (match) => {
    return match.charAt(1).toUpperCase();
  });
}

export default camelCase;
