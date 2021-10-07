import cloneDeep from '../helpers/cloneDeep';
import Game from '../models/Game';
import getRandomInclusiveInteger from '../helpers/getRandomInclusiveInteger';
import Leaderboard from '../models/Leaderboard';

class RunQueue {
  /** @var {number} */
  static baseTotalNumberOfGames = 24000;

  /** @var {number} */
  static targetNumberOfRuns = 5;

  /** RunQueue Constructor */
  constructor() {
    this.forcedGameCategoryIdPairs = [];
    this.runs = [];
    this.totalNumberOfGames = 0;
  }

  /** @return {object|undefined} */
  currentRun() {
    return this.runs[0];
  }

  /** @return {Promise<undefined>} */
  async fillRuns() {
    const run = await this.getRun();
    this.runs.push(run);

    if (this.runs.length < RunQueue.targetNumberOfRuns) {
      await this.fillRuns();
    }
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

  /** @return {array} */
  // eslint-disable-next-line class-methods-use-this
  getAcceptableLeaderboards(leaderboards) {
    return leaderboards.filter((leaderboard) => {
      if (!leaderboard.hasRuns()) {
        return false;
      }

      const worldRecordRun = leaderboard.getWorldRecordRun();

      return worldRecordRun.hasVideo()
        && worldRecordRun.hasExactlyOneVideo()
        && worldRecordRun.hasVideoHostedOnTwitchOrYouTube();
    });
  }

  /** @return {array} */
  // eslint-disable-next-line class-methods-use-this
  getGameCategoryIdPairs(setOfGames) {
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
  async getLeaderboards(gameCategoryIdPairs) {
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

  /** @return {object} */
  // eslint-disable-next-line class-methods-use-this
  getRandomAcceptableLeaderboard(acceptableLeaderboards) {
    const index = getRandomInclusiveInteger(0, acceptableLeaderboards.length - 1);
    return acceptableLeaderboards[index];
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

  /** @return {array} */
  // eslint-disable-next-line class-methods-use-this
  getRandomSubsetOfGames(setOfGames, size) {
    const randomSubsetOfGames = [];
    let internalSetOfGames = cloneDeep(setOfGames);

    internalSetOfGames = internalSetOfGames.filter((game) => game.categories !== undefined);

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

  /** @return {Promise<object>} */
  async getRun() {
    return this.getRandomPageOfGames()
      .then((randomPageOfGames) => {
        const randomSubsetOfGames = this.getRandomSubsetOfGames(randomPageOfGames, 6);
        const gameCategoryIdPairs = this.getGameCategoryIdPairs(randomSubsetOfGames);

        return this.getLeaderboards(gameCategoryIdPairs);
      })
      .then((leaderboards) => {
        const acceptableLeaderboards = this.getAcceptableLeaderboards(leaderboards);
        const randomAcceptableLeaderboard = (
          this.getRandomAcceptableLeaderboard(acceptableLeaderboards)
        );

        const randomAcceptableLeaderboardAsRun = randomAcceptableLeaderboard.transformIntoRun();

        console.log(randomAcceptableLeaderboardAsRun);
        return randomAcceptableLeaderboardAsRun;
      });
  }

  /**
   * The speedrun.com API doesn't allow us to know the total number of games easily,
   * so we must find it ourselves.
   *
   * @return {Promise<undefined>} */
  async getTotalNumberOfGames() {
    const ceiling = await this.findCeiling(RunQueue.baseTotalNumberOfGames + 5000);

    if (ceiling % 250 !== 0) {
      this.totalNumberOfGames = ceiling;
    }

    this.totalNumberOfGames = await this.findTotalNumberOfGames(
      RunQueue.baseTotalNumberOfGames,
      ceiling,
    );
  }

  /** @return {boolean} */
  hasMoreRuns() {
    return this.runs.length > 1;
  }

  /** @return {boolean} */
  hasRuns() {
    return this.runs.length > 0;
  }

  /** @return {Promise<undefined>} */
  async shift() {
    this.runs.shift();
    await this.fillRuns();
  }

  /** @return {Promise<undefined>} */
  async start() {
    await this.getTotalNumberOfGames();

    if (this.forcedGameCategoryIdPairs.length > 0) {
      const leaderboards = await this.getLeaderboards(this.forcedGameCategoryIdPairs);

      this.runs.push(...leaderboards.map((leaderboard) => leaderboard.transformIntoRun()));
    }

    await this.fillRuns();
  }
}

export default RunQueue;
