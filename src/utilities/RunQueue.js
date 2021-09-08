import Game from '../models/Game';

class RunQueue {
  static baseTotalNumberOfGames = 24000;

  /** RunQueue Constructor */
  constructor() {
    this.totalNumberOfGames = 0;
  }

  /** @return {Promise<object>} */
  async getRandomGame() {
    const randomPageOfGames = await this.getRandomPageOfGames();
    console.log(randomPageOfGames);
  }

  /** @return {Promise<array>} */
  async getRandomPageOfGames() {
    const randomOffset = Math.floor(Math.random() * this.totalNumberOfGames);

    return Game.search({
      embed: [
        'categories',
      ],
      offset: randomOffset,
    });
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

    return this.findTotalNumberOfGames(RunQueue.baseTotalNumberOfGames, ceiling);
  }
}

export default RunQueue;
