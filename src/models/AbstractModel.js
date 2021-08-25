import camelCase from '../helpers/camelCase';
import cloneDeep from '../helpers/cloneDeep';
import SpeedrunDotComApiClient from '../clients/SpeedrunDotComApiClient';

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

  /** AbstractModel constructor */
  constructor(data = {}) {
    if (this.constructor.name === 'AbstractModel') {
      throw new Error('An AbstractModel cannot be constructed directly.');
    }

    const tempData = cloneDeep(data);

    Object
      .entries(tempData)
      .forEach(([key, value]) => {
        if (key.includes('-')) {
          const newKey = camelCase(key);
          tempData[newKey] = value;

          delete tempData[key];
        }
      });
    
    Object.assign(this, tempData);
  }

  /** @return {Promise<any>} */
  static findById(id) {
    //
  }

  /** @return {Promise<any>} */
  static async search(params = {}) {
    const records = await SpeedrunDotComApiClient.get(this.BASE_URI, params);

    return records.map((record) => new this(record));
  }
}

export default AbstractModel;
