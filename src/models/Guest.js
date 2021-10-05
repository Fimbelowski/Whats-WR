import AbstractModel from './AbstractModel';

class Guest extends AbstractModel {
  /** @type {object} */
  static get DEFAULTS() {
    return {
      links: [],
      name: '',
    };
  }

  /** @return {string} */
  getName() {
    return this.name;
  }
}

export default Guest;
