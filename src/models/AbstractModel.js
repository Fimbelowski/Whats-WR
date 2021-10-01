import camelCase from '../helpers/camelCase';
import cloneDeep from '../helpers/cloneDeep';

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

    Object
      .entries(this.constructor.EMBEDS)
      .forEach(([key, value]) => {
        if (Object.prototype.hasOwnProperty.call(tempData, key)) {
          let embeddedData;

          if (key === 'runs') {
            const runs = tempData[key];

            if (Array.isArray(runs)) {
              embeddedData = runs.map((run) => run.run);
            }
          } else {
            embeddedData = Object.prototype.hasOwnProperty.call(tempData[key], 'data')
              ? tempData[key].data
              : tempData[key];
          }

          if (Array.isArray(embeddedData)) {
            // eslint-disable-next-line new-cap
            tempData[key] = embeddedData.map((item) => new value(item));
          } else if (embeddedData !== undefined) {
            // eslint-disable-next-line new-cap
            tempData[key] = new value(embeddedData);
          }
        }
      });

    Object.assign(this, tempData);
  }
}

export default AbstractModel;
