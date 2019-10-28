<template>
  <div id="app"/>
</template>

<script>
import axios from 'axios';

export default {
  name: 'app',
  data() {
    return {
      speedrunDotCom: axios.create({
        baseURL: 'https://www.speedrun.com/api/v1/',
        transformResponse: (response) => JSON.parse(response).data,
      }),
      totalNumberOfGames: 17000,
    };
  },
  async created() {
    await this.getTotalNumberOfGames();
    this.findRun();
  },
  methods: {
    /** @return {void} */
    findRun() {
      const categories = [];

      this.getRandomGroupOfGames()
        .then((response) => {
          response.forEach((game) => {
            categories.push(...game.categories.data);
          });

          console.log(categories);
        });
    },

    /** @return {array} */
    async getRandomGroupOfGames() {
      const randomOffset = this.getRandomOffset();
      let response;

      try {
        response = await this.speedrunDotCom.get('games', {
          params: {
            embed: 'categories',
            offset: randomOffset,
          },
        });
      } catch (e) {
        console.error(e);
      }

      return Promise.resolve(response.data);
    },

    /** @return {number} */
    getRandomOffset() {
      return Math.floor(Math.random() * Math.floor(this.totalNumberOfGames - 21));
    },

    /** @return {void} */
    getTotalNumberOfGames() {
      const getNextGroupOfBulkGames = async () => {
        let response;

        try {
          response = await this.speedrunDotCom.get('games', {
            params: {
              _bulk: true,
              max: 1000,
              offset: this.totalNumberOfGames,
            },
          });
        } catch (e) {
          console.error(e);
        }

        const length = response.data.length;
        this.totalNumberOfGames += length;

        if (length === 1000) {
          return getNextGroupOfBulkGames();
        } else {
          return Promise.resolve();
        }
      }

      return getNextGroupOfBulkGames();
    },
  },
}
</script>
