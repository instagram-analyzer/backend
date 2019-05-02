const axios = require("axios");
const cron = require("node-cron");
const models = require("./helpers.js");
const { cookieString, getCookie } = require("./getCookies.js");

let started = false;

const trackPost = async shortcode => {
  try {
    const getPostData = await axios.post(
      `https://www.instagram.com/p/${shortcode}/?__a=1`
    );

    const display_url = getPostData.data.graphql.shortcode_media.display_url;
    const is_video = getPostData.data.graphql.shortcode_media.is_video;
    const view_count = is_video
      ? getPostData.data.graphql.shortcode_media.video_view_count
      : 0;
    const taken_at_timestamp =
      getPostData.data.graphql.shortcode_media.taken_at_timestamp;
    const comments_count =
      getPostData.data.graphql.shortcode_media.edge_media_to_comment.count;

    const likes_count =
      getPostData.data.graphql.shortcode_media.edge_media_preview_like.count;
    const post = {
      display_url,
      is_video,
      view_count,
      taken_at_timestamp,
      comments_count,
      likes_count,
      shortcode
    };

    !started && (await models.add("post_track", post));
    started = true;
    cron.schedule("0 */10 * * * *", async () => {
      console.log(`Fetching post....`);
      await models.add("post_track", post);
    });

    console.log("New post data added");
  } catch ({ message }) {
    console.log({ message });
  }
};

module.exports = trackPost;
