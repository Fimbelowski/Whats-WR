import AbstractModel from './AbstractModel';

class Category extends AbstractModel {
  /** @type {object} */
  static get DEFAULTS() {
    return {
      id: '',
      links: {},
      miscellaneous: false,
      name: '',
      players: {},
      rules: '',
      type: '',
      weblink: '',
    };
  }
}

export default Category;
