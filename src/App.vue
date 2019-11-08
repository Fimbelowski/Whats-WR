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
      this.getRandomGroupOfGames()
        .then((groupOfGames) => {
          let categories = [];

          groupOfGames.forEach((game) => {
            categories.push(...game.categories.data);
          });

          categories = categories.filter(category => category.type === 'per-game');

          const randomGroupOfCategories = this.getRandomGroupOfCategories(categories);
          
          const promises = [];
          randomGroupOfCategories.forEach((category) => {
            promises.push(this.getCategoryRecord(category.id));
          });

          return Promise.all(promises);
        })
        .then((records) => {
          const validRecords = records.filter((item) => {
            console.log(item);
            return item.data.runs.length
              && item.data.runs[0].run.videos
              && item.data.runs[0].run.videos.links.length === 1;
          });

          console.log(validRecords);
        });
    },

    /** @return {Promise<any>} */
    getCategoryRecord(categoryId) {
      return this.speedrunDotCom
        .get(`categories/${categoryId}/records`, {
          params: {
            skip_empty: true,
            top: 1,
          },
          transformResponse: (response) => JSON.parse(response).data[0],
        });
    },

    /** @return {array} */
    getRandomGroupOfCategories(arrayOfCategories) {
      const indices = [];
      const categories = [];

      for (let i = 0; i < 5; i++) {
        let randomIndex = this.getRandomNumber(arrayOfCategories.length - 1);
        while (indices.includes(randomIndex)) {
          randomIndex = this.getRandomNumber(arrayOfCategories.length - 1);
        }

        categories.push(arrayOfCategories[randomIndex]);
        indices.push(randomIndex);
      }

      return categories;
    },

    /** @return {array} */
    async getRandomGroupOfGames() {
      const randomOffset = this.getRandomNumber(this.totalNumberOfGames - 21);
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
    getRandomNumber(max) {
      return Math.floor(Math.random() * Math.floor(max));
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
