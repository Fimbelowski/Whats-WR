<template>
  <div id="app" />
</template>

<script>
import axios from 'axios';

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
    getTotalNumberOfGames() {
      axios.get(`/games?_bulk=yes&max=1000&offset=${this.totalNumberOfGamesStartingOffset}`)
        .then((items) => {
          if (items.data.pagination.size < 1000) {
            this.totalNumberOfGames = this.totalNumberOfGamesOffset + items.data.pagination.size;
            return;
          }

          this.totalNumberOfGamesStartingOffset += 1000;
          this.getTotalNumberOfGames();
        });
    },
  },
};
</script>
