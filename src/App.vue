<template>
  <div id="app" />
</template>

<script>
import axios from 'axios';
import rn from 'random-number';
import parse from 'url-parse';

export default {
  name: 'App',
  data() {
    return {
      speedrunDotComApi: axios.create({
        baseURL: 'https://www.speedrun.com/api/v1',
        transformResponse: axios.defaults.transformResponse.concat(data => data.data),
      }),
      totalNumberOfGames: 16000,
      validHostNames: [
        'www.youtube.com',
        'youtu.be',
        'www.twitch.tv',
      ],
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
      let groupOfGames;

      try {
        groupOfGames = await this.getRandomGroupOfGames();
      } catch (e) {
        //
      }

      groupOfGames = groupOfGames.data;
      const groupOfCategories = this.extractCategoriesFrom(groupOfGames);

      const promises = [];

      for (let i = 0; i < 3; i += 1) {
        const categoryId = groupOfCategories[rn({
          integer: true,
          min: 0,
          max: groupOfCategories.length - 1,
        })].id;

        promises.push(this.speedrunDotComApi.get(`/categories/${categoryId}/records`, {
          params: {
            top: 1,
          },
        }));
      }

      let categoryRecords;

      Promise.all(promises)
        .then((values) => {
          categoryRecords = values.filter((category) => {
            return (
              category.data[0].runs.length
              && category.data[0].runs[0].run.videos
              && category.data[0].runs[0].run.videos.links
              && category.data[0].runs[0].run.videos.links.length
            );
          });

          categoryRecords = categoryRecords.filter((category) => {
            const url = parse(category.data[0].runs[0].run.videos.links[0].uri);
            console.log(url);

            return this.validHostNames.includes(url.hostname);
          });

          categoryRecords.forEach((category) => {
            console.log(category.data[0].runs[0].run.videos.links[0].uri);
          });
        });
    },

    /** @return {void} */
    findTotalNumberOfGames() {
      this.speedrunDotComApi.get('/games', {
        params: {
          _bulk: 'yes',
          max: 1000,
          offset: this.totalNumberOfGames,
        },
      })
        .then((response) => {
          const count = response.data.length;
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
      return this.speedrunDotComApi.get('/games', {
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
