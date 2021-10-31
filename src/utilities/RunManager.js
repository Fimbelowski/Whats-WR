import RunFinder from './RunFinder';

class RunManager {
  /** @var {number} */
  static targetNumberOfRuns = 15;

  /** RunManager Constructor */
  constructor() {
    this.currentRun = null;
    this.history = {};
    this.initialGameCategoryIdPair = null;
    this.isFindingRuns = false;
    this.nextRuns = [];
    this.runFinder = new RunFinder();
  }

  /** @return {undefined} */
  addRunToHistory(run) {
    const { categoryId, gameId } = run.getGameCategoryIdPair();

    this.history[`${gameId}-${categoryId}`] = run;
  }

  /** @return {Promise<undefined>} */
  async getNextRun() {
    this.addRunToHistory(this.currentRun);

    this.currentRun = this.nextRuns.shift();

    if (!this.isFindingRuns) {
      this.isFindingRuns = true;

      await this.maybeFindAnotherRun();

      this.isFindingRuns = false;
    }
  }

  /** @return {undefined} */
  getRunFromHistory(key) {
    this.addRunToHistory(this.currentRun);

    const runFromHistory = this.history[key];

    if (runFromHistory !== undefined) {
      this.currentRun = runFromHistory;
    }
  }

  /** @return {boolean} */
  hasHistory() {
    return Object
      .keys(this.history)
      .length > 0;
  }

  /** @return {boolean} */
  hasNextRuns() {
    return this.nextRuns.length > 0;
  }

  /** @return {Promise<undefined>} */
  async maybeFindAnotherRun() {
    const run = await this.runFinder.findRun();

    if (this.currentRun === null) {
      this.currentRun = run;
    } else {
      this.nextRuns.push(run);
    }

    if (this.nextRuns.length < RunManager.targetNumberOfRuns) {
      await this.maybeFindAnotherRun();
    }
  }

  /** @return {Promise<undefined>} */
  async start() {
    if (this.initialGameCategoryIdPair !== null) {
      this.currentRun = await this.runFinder.findRun(this.initialGameCategoryIdPair);
    }

    this.isFindingRuns = true;

    await this.runFinder.getTotalNumberOfGames();
    await this.maybeFindAnotherRun();

    this.isFindingRuns = false;
  }
}

export default RunManager;
