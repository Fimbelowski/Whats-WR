import { nextTick } from 'vue';
import Game from '../models/Game';

class RunQueue {
  static baseTotalNumberOfGames = 20000;

  /** @return {Promise<number>} */
  async getTotalNumberOfGames() {
    const findCeiling = async (potentialCeiling) => {
      const adjustedOffset = potentialCeiling - 250;
      
      const response = await Game.search({
        offset: adjustedOffset,
        _bulk: true,
      });

      const json = await response.json();
      const numberOfGames = json.data.length;
      
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
      const adjustedOffset = median - 250;

      const response = await Game.search({
        offset: adjustedOffset,
        _bulk: true,
      });

      const json = await response.json();
      const numberOfGames = json.data.length;

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
