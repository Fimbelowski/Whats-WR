import Game from '../models/Game';

class RunQueue {
  static baseTotalNumberOfGames = 24000;

  /** RunQueue Constructor */
  constructor() {
    this.totalNumberOfGames = 0;
  }

  /** @return {number} */
  getAdjustedOffset(offset, bulk = false) {
    const adjustmentDifference = bulk
      ? 250
      : 20;

    return offset - adjustmentDifference;
  }

  /** @return {Promise<array>} */
  async getRandomPageOfGames() {
    const randomOffset = Math.floor(Math.random() * this.totalNumberOfGames);
    const adjustedOffset = this.getAdjustedOffset(randomOffset);
    
    const games = await Game.search({
      offset: adjustedOffset,
    });
  }

  /** @return {Promise<number>} */
  async findCeiling(potentialCeiling) {
    const adjustedOffset = this.getAdjustedOffset(potentialCeiling, true);
      
    const games = await Game.search({
      offset: adjustedOffset,
      _bulk: true,
    });

    const numberOfGames = games.length;
    
    if (numberOfGames === 0) {
      return potentialCeiling;
    } else if (numberOfGames > 0 && numberOfGames < 250) {
      return adjustedOffset + numberOfGames;
    }

    return this.findCeiling(potentialCeiling + 5000);
  }

  /** @return {Promise<number>} */
  async findTotalNumberOfGames(floor, ceiling) {
    const median = Math.round(((ceiling - floor) / 2) + floor);
    const adjustedOffset = this.getAdjustedOffset(median, true);

    const games = await Game.search({
      offset: adjustedOffset,
      _bulk: true,
    });

    const numberOfGames = games.length;

    if (numberOfGames === 0) {
      return this.findTotalNumberOfGames(floor, median);
    } else if (numberOfGames > 0 && numberOfGames < 250) {
      return adjustedOffset + numberOfGames;
    }

    return this.findTotalNumberOfGames(median, ceiling);
  }

  /** @return {Promise<void>} */
  async getTotalNumberOfGames() {
    const ceiling = await this.findCeiling(RunQueue.baseTotalNumberOfGames + 5000);

    if (ceiling % 250 !== 0) {
      return ceiling;
    }

    this.totalNumberOfGames = await this.findTotalNumberOfGames(RunQueue.baseTotalNumberOfGames, ceiling);
  }
}

export default RunQueue;
