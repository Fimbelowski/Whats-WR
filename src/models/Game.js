import AbstractModel from './AbstractModel';

class Game extends AbstractModel {
  /** @type {string} */
  static get BASE_URI() {
    return 'games';
  }

  /** @type {object} */
  static get DEFAULTS() {
    return {};
  }
}

export default Game;
