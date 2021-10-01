import cloneDeep from '../helpers/cloneDeep';
import Game from '../models/Game';
import getRandomInclusiveInteger from '../helpers/getRandomInclusiveInteger';
import Leaderboard from '../models/Leaderboard';

class RunQueue {
  static baseTotalNumberOfGames = 24000;

  /** RunQueue Constructor */
  constructor() {
    this.totalNumberOfGames = 0;
  }

  /** @return {array} */
  // eslint-disable-next-line class-methods-use-this
  getAcceptableLeaderboards(leaderboards) {
    return leaderboards.filter((leaderboard) => {
      if (!leaderboard.hasRuns()) {
        return false;
      }

      const worldRecordRun = leaderboard.runs[0];

      return worldRecordRun.hasVideo()
        && worldRecordRun.hasExactlyOneVideo()
        && worldRecordRun.hasVideoHostedOnTwitchOrYouTube();
    });
  }

  /** @return {Promise<array>} */
  // eslint-disable-next-line class-methods-use-this
  async getGameCategoryIdPairs(setOfGames) {
    return setOfGames.map((game) => {
      const gameCategoryIdPair = {
        gameId: game.id,
      };

      const categoryIndex = getRandomInclusiveInteger(0, game.categories.length - 1);

      gameCategoryIdPair.categoryId = game.categories[categoryIndex].id;

      return gameCategoryIdPair;
    });
  }

  /** @return {Promise<array>} */
  // eslint-disable-next-line class-methods-use-this
  async getLeaderboardsFromGameCategoryIdPairs(gameCategoryIdPairs) {
    const promises = gameCategoryIdPairs.map((gameCategoryIdPair) => Leaderboard.search({
      ...gameCategoryIdPair,
      embed: [
        'category',
        'game',
        'players',
      ],
      top: 1,
    }));

    return Promise.all(promises);
  }

  /** @return {Promise<object>} */
  async getRun() {
    const randomPageOfGames = await this.getRandomPageOfGames();
    const randomSubsetOfGames = await this.getRandomSubsetOfGames(randomPageOfGames, 6);

    const gameCategoryIdPairs = await this.getGameCategoryIdPairs(randomSubsetOfGames);

    const leaderboards = await this.getLeaderboardsFromGameCategoryIdPairs(gameCategoryIdPairs);

    const acceptableLeaderboards = this.getAcceptableLeaderboards(leaderboards);
    console.log(acceptableLeaderboards);
  }

  /** @return {Promise<array>} */
  async getRandomPageOfGames() {
    const randomOffset = getRandomInclusiveInteger(0, this.totalNumberOfGames);

    return Game.search({
      embed: [
        'categories',
      ],
      offset: randomOffset,
    });
  }

  /** @return {Promise<array>} */
  // eslint-disable-next-line class-methods-use-this
  getRandomSubsetOfGames(setOfGames, size) {
    const randomSubsetOfGames = [];
    let internalSetOfGames = cloneDeep(setOfGames);

    internalSetOfGames.forEach((game, index) => {
      internalSetOfGames[index].categories = game.categories.filter((category) => category.type !== 'per-level');
    });

    internalSetOfGames = internalSetOfGames.filter((game) => game.categories.length > 0);

    if (internalSetOfGames.length <= size) {
      return internalSetOfGames;
    }

    for (let i = 0; i < size; i += 1) {
      const randomIndex = getRandomInclusiveInteger(0, randomSubsetOfGames.length);
      const randomGame = internalSetOfGames[randomIndex];
      randomSubsetOfGames.push(randomGame);

      internalSetOfGames.splice(randomIndex, 1);
    }

    return randomSubsetOfGames;
  }

  /** @return {Promise<number>} */
  async findCeiling(potentialCeiling) {
    const games = await Game.search({
      offset: potentialCeiling,
      _bulk: true,
    });

    const numberOfGames = games.length;

    if (numberOfGames === 0) {
      return potentialCeiling;
    }

    if (numberOfGames > 0 && numberOfGames < 250) {
      return Game.getAdjustedOffset(potentialCeiling, true) + numberOfGames;
    }

    return this.findCeiling(potentialCeiling + 5000);
  }

  /** @return {Promise<number>} */
  async findTotalNumberOfGames(floor, ceiling) {
    const median = Math.round(((ceiling - floor) / 2) + floor);

    const games = await Game.search({
      offset: median,
      _bulk: true,
    });

    const numberOfGames = games.length;

    if (numberOfGames === 0) {
      return this.findTotalNumberOfGames(floor, median);
    }

    if (numberOfGames > 0 && numberOfGames < 250) {
      return Game.getAdjustedOffset(median, true) + numberOfGames;
    }

    return this.findTotalNumberOfGames(median, ceiling);
  }

  /**
   * The speedrun.com API doesn't allow us to know the total number of games easily,
   * so we must find it ourselves.
   *
   * @return {Promise<void>} */
  async getTotalNumberOfGames() {
    const ceiling = await this.findCeiling(RunQueue.baseTotalNumberOfGames + 5000);

    if (ceiling % 250 !== 0) {
      return ceiling;
    }

    return this.findTotalNumberOfGames(
      RunQueue.baseTotalNumberOfGames,
      ceiling,
    );
  }
}

export default RunQueue;
