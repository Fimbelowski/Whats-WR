import AbstractModel from './AbstractModel';

class User extends AbstractModel {
  /** @type {object} */
  static get DEFAULTS() {
    return {
      assets: {},
      hitbox: '',
      id: '',
      links: {},
      location: {},
      names: {},
      nameStyle: {},
      pronouns: null,
      role: '',
      signup: '',
      speedrunslive: '',
      twitch: null,
      twitter: null,
      weblink: '',
      youtube: null,
    };
  }
}

export default User;
