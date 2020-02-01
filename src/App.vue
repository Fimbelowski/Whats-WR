<template>
  <div id="app"/>
</template>

<script>
import axios from 'axios';
import parseUrl from 'parse-url';

export default {
  name: 'app',
  data() {
    return {
      acceptableRecords: [],
      speedrunDotCom: axios.create({
        baseURL: 'https://www.speedrun.com/api/v1/',
        transformResponse: (response) => JSON.parse(response).data,
      }),
      targetNumberOfAcceptableRecords: 5,
      totalNumberOfGames: 17000,
    };
  },
  async created() {
    await this.getTotalNumberOfGames();

    for (let i = 0; i < this.targetNumberOfAcceptableRecords; i+= 1) {
      this.findRun();
    }
  },
  methods: {
    /** @return {void} */
    findRun() {
      this.getRandomGroupOfGames()
        .then((groupOfGames) => {
          const categories = groupOfGames.map(game => game.categories.data).flat().filter(category => category.type === 'per-game');

          const randomGroupOfCategories = this.getRandomGroupOfCategories(categories);
          return this.getRecordsFromGroupOfCategories(randomGroupOfCategories);
        })
        .then((groupOfRecords) => {
          const acceptableRecords = this.filterPotentialRecords(groupOfRecords);

          return acceptableRecords[this.getRandomNumber(acceptableRecords.length - 1)];
        })
        .then((chosenRecord) => {
          return this.getDetailedRecord(chosenRecord.runs[0].run.id);
        })
        .then((detailedRecord) => {
          this.acceptableRecords.push(detailedRecord);
        })
        .catch(() => {
          this.findRun();
        });
    },

    /** @return {array} */
    filterPotentialRecords(groupOfRecords) {
      return groupOfRecords.filter((record) => {
        try {
          if (
            !(
              record.runs.length
                && record.runs[0].run.videos
                && record.runs[0].run.videos.links.length === 1
            )
          ) {
            return false;
          }
        } catch (e) {
          console.log(e);
        }

        let parsedUrl;

        try {
          parsedUrl = parseUrl(record.runs[0].run.videos.links[0].uri);
        } catch (e) {
          return false;
        }

        if (!['youtu.be', 'www.youtube.com', 'www.twitch.tv'].includes(parsedUrl.resource)) {
          return false;
        }

        return true;
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

    /** @return {Promise<any>} */
    async getDetailedRecord(runId) {
      const response = await this.speedrunDotCom.get(`runs/${runId}`, {
          params: {
            embed: ['category', 'game', 'players'],
          },
        });

      return response.data;
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

      return response.data;
    },

    /** @return {number} */
    getRandomNumber(max) {
      return Math.floor(Math.random() * Math.floor(max));
    },

    /** @return {array} */
    async getRecordsFromGroupOfCategories(categories) {
      const promises = [];

      categories.forEach((category) => {
        promises.push(this.getCategoryRecord(category.id));
      });

      const responses = await Promise.all(promises);

      return responses.map(response => response.data);
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
