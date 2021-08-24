import AbstractModel from './AbstractModel';
import Category from './Category';

class Game extends AbstractModel {
  /** @type {string} */
  static get BASE_URI() {
    return 'games';
  }

  /** @type {object} */
  static get EMBEDS() {
    return {
      categories: Category,
    };
  }

  /** @type {object} */
  static get DEFAULTS() {
    return {
      abbreviation: null,
      assets: {},
      categories: [],
      created: null,
      developers: [],
      engines: [],
      gametypes: [],
      genres: [],
      id: null,
      links: [],
      moderators: {},
      names: {},
      platforms: [],
      publishers: [],
      regions: [],
      release_date: null,
      released: null,
      romhack: false,
      ruleset: {},
      weblink: null,
    };
  }
}

export default Game;
