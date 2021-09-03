/** @return {number} */
function getAdjustedOffset(offset, bulk = false) {
  const adjustmentDifference = bulk
    ? 250
    : 20;

  const adjustedOffset = offset - adjustmentDifference;

  if (adjustedOffset < 0) {
    return 0;
  }

  return adjustedOffset;
}

export default getAdjustedOffset;
