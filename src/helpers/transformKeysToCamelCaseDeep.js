import camelCase from './camelCase';

/** @return {object} */
function transformKeysToCamelCaseDeep(object) {
  const transformedObject = {};

  Object
    .entries(object)
    .forEach(([key, value]) => {
      const isNestedObject = !Array.isArray(value) && typeof value === 'object' && value !== null;

      transformedObject[camelCase(key)] = isNestedObject
        ? transformKeysToCamelCaseDeep(value)
        : value;
    });

  return transformedObject;
}

export default transformKeysToCamelCaseDeep;
