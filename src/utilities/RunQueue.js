import { nextTick } from 'vue';
import Game from '../models/Game';

class RunQueue {
  static baseTotalNumberOfGames = 24000;

  /** @return {number} */
  getAdjustedOffset(offset) {
    return offset - 250;
  }

  /** @return {Promise<number>} */
  async getTotalNumberOfGames() {
    const findCeiling = async (potentialCeiling) => {
      const adjustedOffset = this.getAdjustedOffset(potentialCeiling);
      
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

      return findCeiling(potentialCeiling + 5000);
    };

    const ceiling = await findCeiling(RunQueue.baseTotalNumberOfGames + 5000);

    if (ceiling % 250 !== 0) {
      return ceiling;
    }

    const findTotalNumberOfGames = async (floor, ceiling) => {
      const median = Math.round(((ceiling - floor) / 2) + floor);
      const adjustedOffset = this.getAdjustedOffset(median);

      const games = await Game.search({
        offset: adjustedOffset,
        _bulk: true,
      });

      const numberOfGames = games.length;

      if (numberOfGames === 0) {
        return findTotalNumberOfGames(floor, median);
      } else if (numberOfGames > 0 && numberOfGames < 250) {
        return adjustedOffset + numberOfGames;
      }

      return findTotalNumberOfGames(median, ceiling);
    };

    return findTotalNumberOfGames(RunQueue.baseTotalNumberOfGames, ceiling);
  }
}

export default RunQueue;
