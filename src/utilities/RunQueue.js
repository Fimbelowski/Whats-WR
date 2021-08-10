import Game from '../models/Game';

class RunQueue {
  static baseTotalNumberOfGames = 20000;

  /** RunQueue Constructor */
  constructor() {
    this.totalNumberOfGames = RunQueue.baseTotalNumberOfGames;
  }

  /** @return {Promise<number>} */
  async getTotalNumberOfGames() {
    const nextPageOfGames = await Game.search({
      offset: this.totalNumberOfGames,
      _bulk: true,
    });

    console.log(nextPageOfGames);
  }
}

export default RunQueue;
