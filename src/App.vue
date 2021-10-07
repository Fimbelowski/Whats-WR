<template>
  <div
    v-if="runQueue.hasRuns()"
  >
    <VideoEmbed
      :uri="runQueue.currentRun().getVideoUri()"
    />
    <h1>
      <a
        :href="runQueue.currentRun().category.weblink"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ runQueue.currentRun().game.getTitle() }} - {{ runQueue.currentRun().category.name }}
      </a> in
      {{ runQueue.currentRun().getFormattedTime() }} ({{ runQueue.currentRun().getTimingMethod() }})
    </h1>
    <h3>
      Players:
    </h3>
    <div
      v-for="player in runQueue.currentRun().players"
      :key="player.id"
    >
      <a
        :href="player.weblink"
        rel="noopener noreferrer"
        target="_blank"
      >
        {{ player.getName() }}
      </a>
      <ul>
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
import RunQueue from './utilities/RunQueue';
import VideoEmbed from './components/VideoEmbed.vue';

export default {
  name: 'App',

  components: {
    VideoEmbed,
  },

  data() {
    return {
      runQueue: new RunQueue(),
    };
  },

  created() {
    this.runQueue.start();
  },
};
</script>
