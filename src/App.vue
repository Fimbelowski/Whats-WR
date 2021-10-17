<template>
  <div
    v-if="runQueue.hasRuns()"
  >
    <VideoEmbed
      :uri="currentRun.getVideoUri()"
    />
    <h1>
      <a
        :href="currentRun.category.weblink"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ currentRun.game.getTitle() }} - {{ currentRun.category.name }}
      </a> in
      {{ currentRun.getFormattedTime() }} ({{ currentRun.getTimingMethod() }})
    </h1>
    <h3>
      Players:
    </h3>
    <div
      v-for="player in currentRun.players"
      :key="player.id"
    >
      <a
        :href="player.weblink"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ player.getName() }}
      </a>
      <ul
        v-if="!(player instanceof Guest)"
      >
        <li
          v-if="player.hasSocial('twitch')"
        >
          <a
            :href="player.getSocialUri('twitch')"
            rel="noopener noreferrer"
            target="_blank"
          >
            Twitch
          </a>
        </li>
        <li
          v-if="player.hasSocial('twitter')"
        >
          <a
            :href="player.getSocialUri('twitter')"
            rel="noopener noreferrer"
            target="_blank"
          >
            Twitter
          </a>
        </li>
        <li
          v-if="player.hasSocial('youtube')"
        >
          <a
            :href="player.getSocialUri('youtube')"
            rel="noopener noreferrer"
            target="_blank"
          >
            YouTube
          </a>
        </li>
      </ul>
    </div>
    <button
      :disabled="!runQueue.hasMoreRuns()"
      @click="runQueue.shift()"
    >
      Next Run
    </button>
  </div>
</template>

<script>
import Guest from './models/Guest';
import RunQueue from './utilities/RunQueue';
import VideoEmbed from './components/VideoEmbed.vue';

export default {
  name: 'App',

  components: {
    VideoEmbed,
  },

  data() {
    return {
      Guest,
      hashRegex: /#(?<gameId>[a-z\d]+)-(?<categoryId>[a-z\d]+)/,
      runQueue: new RunQueue(),
    };
  },

  computed: {
    /** @type {object} */
    currentRun() {
      return this.runQueue.currentRun();
    },
  },

  watch: {
    currentRun(newValue) {
      const categoryId = newValue.category.id;
      const gameId = newValue.game.id;

      const newUrl = `${window.location.origin}#${gameId}-${categoryId}`;

      if (window.location.hash === '') {
        window.history.replaceState({}, '', newUrl);
        return;
      }

      window.history.pushState({}, '', newUrl);
    },
  },

  created() {
    window.addEventListener('hashchange', () => {
      const { hash } = window.location;

      if (this.isHashValid(hash)) {
        this.runQueue.getRunFromLookup(hash.slice(1));
      }
    });

    const { hash } = window.location;

    if (this.isHashValid(hash)) {
      this.runQueue.initialGameCategoryIdPair = this.parseHash(hash);
    }

    this.runQueue.start();
  },

  methods: {
    /** @return {boolean} */
    isHashValid(hash) {
      return this.hashRegex.test(hash);
    },

    /** @return {object} */
    parseHash(hash) {
      const matches = this.hashRegex.exec(hash);

      const { categoryId, gameId } = matches.groups;

      return {
        categoryId,
        gameId,
      };
    },
  },
};
</script>
