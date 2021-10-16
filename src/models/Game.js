import AbstractModel from './AbstractModel';
import Category from './Category';
import SpeedrunDotComApiClient from '../clients/SpeedrunDotComApiClient';

class Game extends AbstractModel {
  /** @type {string} */
  static get BASE_URI() {
    return 'games';
  }

  /** Game constructor */
  constructor(data = {}) {
    super(data);

    if (data.categories !== undefined) {
      this.categories = data.categories.data.map((category) => new Category(category));
    }
  }

  /**
   * When searching for games in order to make counting easier, and to prevent querying for an
   * offset that would be partially or completely out of bounds we subtract the number of games per
   * page from the offset.
   *
   * e.g., if we want to know if there are at least 5,000 games instead of searching at an offset
   * of 4,750 (with the _bulk param) and then adding the number of games returned, we simply search
   * at an offset of 5,000 and let the offset be adjusted internally.
   *
   * e.g., if we know there are 1,000 games and we want to get a random page of games (without the
   * _bulk param), offsets 981-1,000 would result in partial or total out of bounds. However,
   * adjusting the offset means that all offsets between 0 and 1,000 are safe and also easier to
   * reason with.
   *
   * @return {number} */
  static getAdjustedOffset(offset, bulk = false) {
    const adjustmentDifference = bulk
      ? 250
      : 20;

    const adjustedOffset = offset - adjustmentDifference;

    if (adjustedOffset < 0) {
      return 0;
    }

    return adjustedOffset;
  }

  /** @return {string} */
  getTitle() {
    let title = this.names.international;

    if (this.names.japanese !== null) {
      title = `${title} (${this.names.japanese})`;
    }

    return title;
  }

  /** @return {Promise<array>} */
  static async search(params = {}) {
    return SpeedrunDotComApiClient
      .get(this.BASE_URI, params)
      .then((response) => response.json())
      .then((results) => {
        const games = results.data;
        return games.map((game) => new this(game));
      });
  }
}

export default Game;
