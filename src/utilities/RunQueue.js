import { nextTick } from 'vue';
import Game from '../models/Game';

class RunQueue {
  static baseTotalNumberOfGames = 20000;

  /** RunQueue Constructor */
  constructor() {
    this.totalNumberOfGames = 0;
  }

  /** @return {Promise<number>} */
  async getTotalNumberOfGames() {
    const guessNextOffset = async (knownNumberOfGames, offsetDelta) => {
      const response = await Game.search({
        offset: (knownNumberOfGames + offsetDelta) - 250,
        _bulk: true,
      });

      const json = await response.json();
      const numberOfGames = json.data.length;

      if (numberOfGames === 0) {
        return guessNextOffset(knownNumberOfGames, offsetDelta / 2);
      }

      const newKnownNumberOfGames = knownNumberOfGames + offsetDelta + numberOfGames;

      if (numberOfGames > 0 && numberOfGames < 250) {
        return newKnownNumberOfGames;
      }

      return guessNextOffset(newKnownNumberOfGames, offsetDelta * 2);
    };

    return guessNextOffset(RunQueue.baseTotalNumberOfGames, 250);
  }
}

export default RunQueue;
