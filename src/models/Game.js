import ky from 'ky';

import AbstractModel from './SpeedrunDotComApi';

class Game extends AbstractModel {
  /** @return {Promise<any>} */
  static search(params = {}) {
    return this.api('games', {
      ...params,
    });
  }
}

export default Game;
