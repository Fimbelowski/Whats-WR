import AbstractModel from './AbstractModel';
import Category from './Category';
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

  /**
   * @return {array}
   * Getting a leaderboard with the top N place runs can result in more than N runs. In this
   * case more players will be listed than are actually in the world record run, so we need to
   * filter the list of players.
   */
  filterPlayers(worldRecordRun) {
    const filteredPlayers = this.players.filter((player) => {
      const playerIds = worldRecordRun.players
        .map((worldRecordRunPlayer) => worldRecordRunPlayer.id);

      return playerIds.includes(player.id);
    });

    const uniqueFilteredPlayers = filteredPlayers.filter((filteredPlayer, index, self) => {
      const indexOfFirstOccurrence = self
        .findIndex((player) => player.id === filteredPlayer.id);

      return index === indexOfFirstOccurrence;
    });

    return uniqueFilteredPlayers;
  }

  /** @return {object} */
  getWorldRecordRun() {
    return this.runs[0];
  }

  /** @return {boolean} */
  hasRuns() {
    return this.runs.length > 0;
  }

  /** @return {Promise<object>} */
  static async findByGameCategoryIdPair({ categoryId, gameId }, params = {}) {
    let uri = this.BASE_URI;

    uri = uri.replace(':gameId', gameId);
    uri = uri.replace(':categoryId', categoryId);

    return SpeedrunDotComApiClient.get(uri, params)
      .then((response) => response.json())
      .then((result) => {
        const leaderboard = result.data;
        return new this(leaderboard);
      });
  }

  /** @return {object} */
  transformIntoRun() {
    const worldRecordRun = this.getWorldRecordRun();

    const run = new Run(worldRecordRun);

    run.category = this.category;
    run.game = this.game;
    run.players = this.filterPlayers(worldRecordRun);

    return run;
  }
}

export default Leaderboard;
