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

  /** @return {boolean} */
  hasExactlyOneVideo() {
    return this.videos.links.length === 1;
  }

  /** @return {boolean} */
  hasVideo() {
    return this.videos !== null;
  }

  /** @return {boolean} */
  hasVideoHostedOnTwitchOrYouTube() {
    const videoUri = this.videos.links[0].uri;

    return videoUri.includes('twitch.tv')
      || videoUri.includes('youtube.com')
      || videoUri.includes('youtu.be');
  }
}

export default Run;
