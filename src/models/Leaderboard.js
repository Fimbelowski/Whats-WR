import AbstractModel from './AbstractModel';
import Category from './Category';
import Game from './Game';
import Guest from './Guest';
import Run from './Run';
import SpeedrunDotComApiClient from '../clients/SpeedrunDotComApiClient';
import User from './User';

class Leaderboard extends AbstractModel {
  /** @type {string} */
  static get BASE_URI() {
    return 'leaderboards/:gameId/category/:categoryId';
  }

  /** Leaderboard constructor */
  constructor(data = {}) {
    super(data);

    this.category = new Category(this.category);
    this.game = new Game(this.game);
    this.players = this.players.data.map((player) => (player.rel === 'user'
      ? new User(player)
      : new Guest(player)));

    this.runs = this.runs.map((run) => new Run(run.run));
  }

  /**
   * @return {array}
   * Getting a leaderboard with the top N place runs can result in more than N runs. In this
   * case more players will be listed than are actually in the world record run, so we need to
   * filter the list of players.
   */
  getUniquePlayers() {
    const worldRecordRun = this.getWorldRecordRun();
    const worldRecordRunPlayers = worldRecordRun.players;

    const matchingPlayers = this.players.filter((player) => {
      const isUser = player.rel === 'user';

      const matchedPlayer = worldRecordRunPlayers.find((worldRecordRunPlayer) => (isUser
        ? worldRecordRunPlayer.id === player.id
        : worldRecordRunPlayer.name === player.name));

      return matchedPlayer !== undefined;
    });

    const uniqueMatchingPlayers = matchingPlayers.filter((matchedPlayer, index, self) => {
      const indexOfFirstOccurrence = self
        .findIndex((player) => player.id === matchedPlayer.id);

      return index === indexOfFirstOccurrence;
    });

    return uniqueMatchingPlayers;
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

    worldRecordRun.category = this.category;
    worldRecordRun.game = this.game;
    worldRecordRun.players = this.getUniquePlayers(worldRecordRun);

    return worldRecordRun;
  }
}

export default Leaderboard;
