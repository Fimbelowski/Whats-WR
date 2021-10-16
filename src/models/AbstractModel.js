import transformKeysToCamelCaseDeep from '../helpers/transformKeysToCamelCaseDeep';

class AbstractModel {
  /** @type {string} */
  static get BASE_URI() {
    return '';
  }

  /** AbstractModel constructor */
  constructor(data = {}) {
    if (this.constructor.name === 'AbstractModel') {
      throw new Error('An AbstractModel cannot be constructed directly.');
    }

    let transformedData = transformKeysToCamelCaseDeep(data);

    if (transformedData.data !== undefined) {
      transformedData = transformedData.data;
    }

    Object.assign(this, transformedData);
  }
}

export default AbstractModel;
