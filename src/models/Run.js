import AbstractModel from './AbstractModel';

class Run extends AbstractModel {
  /** @type {object} */
  static get DEFAULTS() {
    return {
      category: '',
      comment: '',
      date: '',
      game: '',
      id: '',
      level: null,
      links: {},
      players: [],
      status: {},
      submitted: null,
      system: {},
      times: {},
      values: {},
      videos: null,
      weblink: '',
    };
  }

  /** @return {string} */
  getFormattedTime() {
    // eslint-disable-next-line no-useless-escape
    const regex = /PT(?:(?<hours>\d+)H|)(?:(?<minutes>\d+)M|)(?<seconds>[\d\.]+)/;
    const matches = this.times.primary.match(regex);

    const { hours = '0' } = matches.groups;
    let { minutes = '00', seconds } = matches.groups;

    minutes = minutes.padStart(2, '0');

    seconds = seconds.includes('.')
      ? seconds.padStart(6, '0')
      : seconds.padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  /** @return {string} */
  getTimingMethod() {
    const { primary } = this.times;

    if (primary === this.times.realtime) {
      return 'RTA';
    }

    if (primary === this.times.realtime_noloads) {
      return 'RTA (No Loads)';
    }

    return 'IGT';
  }

  /** @return {string} */
  getVideoUri() {
    return this.videos.links[0].uri;
  }

  /** @return {boolean} */
  hasExactlyOneVideo() {
    return this.videos.links.length === 1;
  }

  /** @return {boolean} */
  hasVideo() {
    return this.videos !== null
      && this.videos.links !== undefined;
  }

  /** @return {boolean} */
  hasVideoHostedOnTwitchOrYouTube() {
    const videoUri = this.videos.links[0].uri;

    return (
      videoUri.includes('twitch.tv')
      && !videoUri.includes('/clip/')
      && !videoUri.includes('/c/')
    ) || videoUri.includes('youtube.com')
      || videoUri.includes('youtu.be');
  }
}

export default Run;
