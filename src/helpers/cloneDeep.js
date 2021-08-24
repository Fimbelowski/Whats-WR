/** @return {any} */
function cloneDeep(item) {
  return JSON.parse(JSON.stringify(item));
}

export default cloneDeep;