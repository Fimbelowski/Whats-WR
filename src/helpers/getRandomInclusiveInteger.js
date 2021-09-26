/** @return {number} */
function getRandomInclusiveInteger(min, max) {
  return Math.floor(Math.random() * max) + min;
}

export default getRandomInclusiveInteger;
