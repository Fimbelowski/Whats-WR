import ky from 'ky';

class SpeedrunDotComApiClient {
  /** @type {string} */
  static BASE_URL = 'https://www.speedrun.com/api/v1';

  /** @type {object} */
  static HTTP_CLIENT = ky.create({
    prefixUrl: this.BASE_URL,
  });

  /** @return {Promise<any>} */
  static get(url, options = {}) {
    return SpeedrunDotComApiClient.HTTP_CLIENT.get(url, options);
  }
}

export default SpeedrunDotComApiClient;
