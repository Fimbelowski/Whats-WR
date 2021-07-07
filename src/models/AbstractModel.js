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

  /** AbstractModel constructor */
  constructor(data = {}) {
    if (this.constructor.name === 'AbstractModel') {
      throw new Error('An AbstractModel cannot be constructed directly.');
    }

    Object.assign(this, data);
  }

  /** @return {Promise<any>} */
  static findById(id) {
    //
  }

  /** @return {Promise<any>} */
  static async search(params = {}) {
    return await SpeedrunDotComApiClient.get(this.BASE_URI, params);
  }
}

export default AbstractModel;
