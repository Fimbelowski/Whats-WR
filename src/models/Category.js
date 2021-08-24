import AbstractModel from './AbstractModel';

class Category extends AbstractModel {
  /** @type {string} */
  static get BASE_URI() {
    return 'categories';
  }

  /** @type {object} */
  static get EMBEDS() {
    return {};
  }

  /** @type {object} */
  static get DEFAULTS() {
    return {};
  }
}

export default Category;
