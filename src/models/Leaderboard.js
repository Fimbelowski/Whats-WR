import AbstractModel from './AbstractModel';
import Category from './Category';
import cloneDeep from '../helpers/cloneDeep';
import Game from './Game';
import Run from './Run';
import SpeedrunDotComApiClient from '../clients/SpeedrunDotComApiClient';
import User from './User';

class Leaderboard extends AbstractModel {
  /** @type {string} */
  static get BASE_URI() {
    return 'leaderboards/:gameId/category/:categoryId';
  }

  /** @type {object} */
  static get EMBEDS() {
    return {
      category: Category,
      game: Game,
      players: User,
      runs: Run,
    };
  }

  /** @type {object} */
  static get DEFAULTS() {
    return {
      category: '',
      emulators: '',
      game: '',
      level: '',
      links: [],
      platform: '',
      region: '',
      runs: [],
      timing: '',
      values: {},
      videoOnly: false,
      weblink: '',
    };
  }

  /** @return {boolean} */
  static hasRuns() {
    return this.runs.length > 0;
  }

  /** @return {Promise<object>} */
  static async search(params = {}) {
    const adjustedParams = cloneDeep(params);

    let updatedBaseUri = this.BASE_URI;

    updatedBaseUri = updatedBaseUri.replace(':gameId', adjustedParams.gameId);
    updatedBaseUri = updatedBaseUri.replace(':categoryId', adjustedParams.categoryId);

    delete adjustedParams.gameId;
    delete adjustedParams.categoryId;

    const record = await SpeedrunDotComApiClient.get(updatedBaseUri, adjustedParams);

    return new this(record);
  }
}

export default Leaderboard;
