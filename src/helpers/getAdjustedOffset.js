/** @return {number} */
function getAdjustedOffset(offset, bulk = false) {
  const adjustmentDifference = bulk
    ? 250
    : 20;

  return offset - adjustmentDifference;
}

export default getAdjustedOffset;
