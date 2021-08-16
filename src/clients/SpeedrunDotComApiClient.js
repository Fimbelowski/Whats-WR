import ky from 'ky';

class SpeedrunDotComApiClient {
  /** @type {string} */
  static BASE_URL = 'https://www.speedrun.com/api/v1';

  /** @type {object} */
  static HTTP_CLIENT = ky.create({
    prefixUrl: this.BASE_URL,
  });

  /** @return {Promise<any>} */
  static async get(url, searchParams) {
    const response = await SpeedrunDotComApiClient.HTTP_CLIENT.get(url, {
      searchParams,
    });

    const json = await response.json();
    return json.data;
  }
}

export default SpeedrunDotComApiClient;
