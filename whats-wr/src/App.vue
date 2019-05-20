<template>
  <div id="app" />
</template>

<script>
import axios from 'axios';
import collect from 'collect.js';
import rn from 'random-number';

export default {
  name: 'App',
  data() {
    return {
      totalNumberOfGames: null,
      totalNumberOfGamesOffset: 15000,
    };
  },
  created() {
    this.getTotalNumberOfGames();
  },
  methods: {
    /** @return {void} */
    getRandomCollectionOfCategories() {
      const randomOffset = rn({
        min: 0,
        max: this.totalNumberOfGames - 21,
        integer: true,
      });

      let categories = collect([]);

      axios.get(`/games?embed=categories&offset=${randomOffset}`)
        .then((items) => {
          items.data.data.forEach((item) => {
            categories = categories.concat(item.categories);
          });

          categories = categories.filter(item => item.type === 'per-game');
          console.log(categories);
        });
    },

    /** @return {void} */
    getTotalNumberOfGames() {
      axios.get(`/games?_bulk=yes&max=1000&offset=${this.totalNumberOfGamesOffset}`)
        .then((items) => {
          if (items.data.pagination.size < 1000) {
            this.totalNumberOfGames = this.totalNumberOfGamesOffset + items.data.pagination.size;
            return;
          }

          this.totalNumberOfGamesStartingOffset += 1000;
          this.getTotalNumberOfGames();
        }).finally(() => {
          this.getRandomCollectionOfCategories();
        });
    },
  },
};
</script>
