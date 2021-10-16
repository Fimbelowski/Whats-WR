import AbstractModel from './AbstractModel';

class Guest extends AbstractModel {
  /** @return {string} */
  getName() {
    return this.name;
  }
}

export default Guest;
