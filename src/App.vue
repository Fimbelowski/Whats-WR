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
          const categories = groupOfGames.map(game => game.categories.data).flat().filter(category => category.type === 'per-game');

          const randomGroupOfCategories = this.getRandomGroupOfCategories(categories);
          
          const promises = [];
          randomGroupOfCategories.forEach((category) => {
            promises.push(this.getCategoryRecord(category.id));
          });

          return Promise.all(promises);
        })
        .then((records) => {
          const validRecords = records.filter((item) => {
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
      const clonedArr = [...arrayOfCategories];
      const categories = [];

      for (let i = 0; i < 5; i+= 1) {
        const randomIndex = this.getRandomNumber(clonedArr.length - 1);
        categories.push(clonedArr.splice(randomIndex, 1));
      }

      return categories.flat();
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
