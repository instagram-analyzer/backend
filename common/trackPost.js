const axios = require("axios");
const cron = require("node-cron");
const models = require("./helpers.js");
const { cookieString, getCookie } = require("./getCookies.js");

let post;
const trackPost = async (shortcode, post_id) => {
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
    post = {
      view_count,
      comments_count,
      likes_count,
      post_id
    };

    await models.add("post_track", post);
    console.log("New post data added");
  } catch ({ message }) {
    console.log({ message });
  }
};

const startCron = (shortcode, id) => {
  cron.schedule("0 */1 * * * *", async () => {
    console.log(`Fetching post....`);
    trackPost(shortcode, id);
  });
};

module.exports = { trackPost, startCron };
