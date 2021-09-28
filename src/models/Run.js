import AbstractModel from './AbstractModel';

class Run extends AbstractModel {
  /** @type {object} */
  static get DEFAULTS() {
    return {
      category: '',
      comment: '',
      date: '',
      game: '',
      id: '',
      level: null,
      links: {},
      players: [],
      status: {},
      submitted: null,
      system: {},
      times: {},
      values: {},
      videos: null,
      weblink: '',
    };
  }

  /** @return {boolean} */
  hasVideo() {
    return this.videos !== null;
  }
}

export default Run;
