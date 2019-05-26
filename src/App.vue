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
          }
        });
    },
  },
};
</script>
