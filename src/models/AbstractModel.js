import transformKeysToCamelCaseDeep from '../helpers/transformKeysToCamelCaseDeep';

class AbstractModel {
  /** @type {string} */
  static get BASE_URI() {
    return '';
  }

  /** @type {object} */
  static get DEFAULTS() {
    return {};
  }

  /** @type {object} */
  static get EMBEDS() {
    return {};
  }

  /** @return {object} */
  static TRANSFORM_FOR_EMBEDDING(record) {
    return new this(record);
  }

  /** AbstractModel constructor */
  constructor(data = {}) {
    if (this.constructor.name === 'AbstractModel') {
      throw new Error('An AbstractModel cannot be constructed directly.');
    }

    const tempData = transformKeysToCamelCaseDeep(data);

    Object
      .entries(this.constructor.EMBEDS)
      .forEach(([key, value]) => {
        if (Object.prototype.hasOwnProperty.call(tempData, key)) {
          let dataToEmbed = tempData[key];

          if (Object.prototype.hasOwnProperty.call(dataToEmbed, 'data')) {
            dataToEmbed = dataToEmbed.data;
          }

          if (Array.isArray(dataToEmbed)) {
            tempData[key] = dataToEmbed.map((record) => value.TRANSFORM_FOR_EMBEDDING(record));
          } else {
            tempData[key] = value.TRANSFORM_FOR_EMBEDDING(dataToEmbed);
          }
        }
      });

    Object.assign(this, tempData);
  }
}

export default AbstractModel;
