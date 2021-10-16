import AbstractModel from './AbstractModel';

class User extends AbstractModel {
  /** @return {string} */
  getName() {
    let name = this.names.international;

    if (this.names.japanese !== null) {
      name = `${name} (${this.names.japanese})`;
    }

    return name;
  }

  /** @return {string} */
  getSocialUri(key) {
    return this[key].uri;
  }

  /** @return {boolean} */
  hasSocial(key) {
    return this[key] !== null;
  }
}

export default User;
