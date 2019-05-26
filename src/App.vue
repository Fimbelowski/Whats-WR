<template>
  <div id="app" />
</template>

<script>
import axios from 'axios';
import rn from 'random-number';

export default {
  name: 'App',
  data() {
    return {
      totalNumberOfGames: 15000,
    };
  },
  created() {
    this.findTotalNumberOfGames();
  },
  methods: {
    /** @return {array} */
    extractCategoriesFrom(games) {
      let categories = [];

      games.forEach((game) => {
        categories = categories.concat(game.categories.data);
      });

      categories = categories.filter(category => category.type === 'per-game');

      return categories;
    },

    /** @return {void} */
    async findRun() {
      let groupOfCategories;
      let groupOfGames;

      try {
        groupOfGames = await this.getRandomGroupOfGames();
      } catch (e) {
        //
      }

      groupOfGames = groupOfGames.data.data;
      groupOfCategories = this.extractCategoriesFrom(groupOfGames);
    },

    /** @return {void} */
    findTotalNumberOfGames() {
      axios.get('/games', {
        params: {
          _bulk: 'yes',
          max: 1000,
          offset: this.totalNumberOfGames,
        },
      })
        .then((response) => {
          const count = response.data.data.length;
          this.totalNumberOfGames += count;

          if (count === 1000) {
            this.findTotalNumberOfGames();
            return;
          }

          this.findRun();
        });
    },

    /** @return {array} */
    getRandomGroupOfGames() {
      return axios.get('/games', {
        params: {
          embed: 'categories',
          offset: rn({
            min: 0,
            max: this.totalNumberOfGames - 21,
            integer: true,
          }),
        },
      });
    },
  },
};
</script>
