import ky from "ky";

class AbstractModel {
  /** SpeedrunDotComApi Constructor */
  constructor() {
    if (this.constructor.name === 'SpeedrunDotComApi') {
      throw new Error('A SpeedrunDotComApi cannot be constructed directly.');
    }
  }

  /** @type {object} */
  static api = ky.create({
    prefixUrl: 'https://speedrun.com/api/v1/',
  });
}

export default AbstractModel;
