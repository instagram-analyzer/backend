const route = require("express").Router();
const { authenticate } = require("../../common/authentication.js");
const models = require("../../common/helpers");
const db = require("../../data/dbConfig");
// const { cookieString } = require("../../common/getCookies.js");
const startProfileUpdateCron = require("../../common/updateProfileCron.js");
const getFollowers = require("../../common/followers.js");
const getPosts = require("../../common/posts.js");
const axios = require("axios");
const { trackPost, startCron } = require("../../common/trackPost.js");
const cron = require("node-cron");

const { cookieSet } = require("../../common/cookie");

let cookieString = "";
let currentCookie = 0;

const getCookie = () => {
  cookieString = "";
  let cookieNames = [];
  //"cookie1=value; cookie2=value; cookie3=value;"
  const cookies = cookieSet[currentCookie].map(cookie => {
    cookieNames.push({ name: cookie.name, value: cookie.value });
  });

  cookieNames.map(cookie => {
    cookieString += `${cookie.name}=${cookie.value}; `;
  });
};

getCookie();

route.get("/profile/hourly/:username", authenticate, async (req, res) => {
  const { username } = req.params;

  try {
    const hourlyData = await models.findAllBy("updating_accounts", {
      account_username: username
    });
    res.json(hourlyData);
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

route.get("/profile/analyze/:account_id", authenticate, async (req, res) => {
  const { account_id } = req.params;

  try {
    getFollowers(account_id);
    getPosts(account_id);
    res.json({ message: "Deep analysis has started" });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

route.get("/profile/:username", async (req, res) => {
  const { username } = req.params;

  try {
    let aveLikes;
    let aveComments;
    let aveViews;
    let totalEngagment;

    const getProfile = await axios.get(
      `https://www.instagram.com/${username}/?__a=1`,
      {
        headers: {
          Cookie: cookieString
        }
      }
    );

    const posts =
      getProfile.data.graphql.user.edge_owner_to_timeline_media.edges;
    const postsLength = posts.length;

    if (postsLength) {
      let totalLikes = await posts
        .map(p => {
          return p.node.edge_liked_by.count;
        })
        .reduce((a, b) => a + b, 0);

      let totalComments = await posts
        .map(p => {
          return p.node.edge_media_to_comment.count;
        })
        .reduce((a, b) => a + b, 0);

      let totalViews = await posts
        .filter(p => p.node.is_video)
        .map(p => {
          return p.node.video_view_count;
        })
        .reduce((a, b) => a + b, 0);

      let videoCount = await posts.filter(p => p.node.is_video).length;

      totalEngagment =
        Math.round(
          ((totalLikes + totalComments) /
            getProfile.data.graphql.user.edge_followed_by.count) *
            100
        ) / 100;
      aveLikes = totalLikes / postsLength;
      aveComments = totalComments / postsLength;
      aveViews = totalViews / videoCount;
    }

    const account = await models.findBy("accounts", {
      account_username: username
    });

    if (account) {
      const updateAccount = await models.update("accounts", account.id, {
        instagram_id: getProfile.data.graphql.user.id,
        account_bio: getProfile.data.graphql.user.biography,
        account_bio_url: getProfile.data.graphql.user.external_url,
        account_username: getProfile.data.graphql.user.username,
        account_image_url: getProfile.data.graphql.user.profile_pic_url_hd,
        follower_count: getProfile.data.graphql.user.edge_followed_by.count,
        following_count: getProfile.data.graphql.user.edge_follow.count,
        hightlight_reel_count:
          getProfile.data.graphql.user.highlight_reel_count,
        full_name: getProfile.data.graphql.user.full_name,
        is_verified: getProfile.data.graphql.user.is_verified,
        is_business_account: getProfile.data.graphql.user.is_business_account,
        business_category_name:
          getProfile.data.graphql.user.business_category_name,
        is_private: getProfile.data.graphql.user.is_private,
        is_joined_recently: getProfile.data.graphql.user.is_joined_recently,
        average_likes: postsLength ? Math.round(aveLikes * 100) / 100 : 0,
        average_comments: postsLength ? Math.round(aveComments * 100) / 100 : 0,
        average_views: postsLength ? Math.round(aveViews * 100) / 100 : 0,
        total_engagement: postsLength ? totalEngagment : 0,
        posts_count:
          getProfile.data.graphql.user.edge_owner_to_timeline_media.count
      });

      newAccount = await models.findBy("accounts", { id: account.id });
      const localPosts = await models.findAllBy("account_posts", {
        account_id: account.id
      });

      const account_posts = await models
        .findAllBy("account_posts", {
          account_id: account.id
        })
        .orderBy("taken_at_timestamp", "desc");

      newAccount.posts = account_posts;
      getPosts(getProfile.data.graphql.user.id);
      startProfileUpdateCron(username);
      cron.schedule("* */2 * * * *", () => {
        getPosts(getProfile.data.graphql.user.id);
      });
      res.json(newAccount);
    } else {
      getPosts(getProfile.data.graphql.user.id);
      startProfileUpdateCron(username);
      cron.schedule("* */2 * * * *", () => {
        getPosts(getProfile.data.graphql.user.id);
      });

      const [addAccount] = await models
        .add("accounts", {
          instagram_id: getProfile.data.graphql.user.id,
          account_bio: getProfile.data.graphql.user.biography,
          account_bio_url: getProfile.data.graphql.user.external_url,
          account_username: getProfile.data.graphql.user.username,
          account_image_url: getProfile.data.graphql.user.profile_pic_url_hd,
          follower_count: getProfile.data.graphql.user.edge_followed_by.count,
          following_count: getProfile.data.graphql.user.edge_follow.count,
          hightlight_reel_count:
            getProfile.data.graphql.user.highlight_reel_count,
          full_name: getProfile.data.graphql.user.full_name,
          is_verified: getProfile.data.graphql.user.is_verified,
          is_business_account: getProfile.data.graphql.user.is_business_account,
          business_category_name:
            getProfile.data.graphql.user.business_category_name,
          is_private: getProfile.data.graphql.user.is_private,
          is_joined_recently: getProfile.data.graphql.user.is_joined_recently,
          average_likes: postsLength ? Math.round(aveLikes * 100) / 100 : 0,
          average_comments: postsLength
            ? Math.round(aveComments * 100) / 100
            : 0,
          // average_views: postsLength ? Math.round(aveViews * 100) / 100 : 0,
          total_engagement: postsLength ? totalEngagment : 0,
          posts_count:
            getProfile.data.graphql.user.edge_owner_to_timeline_media.count
        })
        .returning("id");

      newAccount = await models.findBy("accounts", { id: addAccount });

      const account_posts = await models
        .findAllBy("account_posts", {
          account_id: addAccount
        })
        .orderBy("taken_at_timestamp", "desc");
      newAccount.posts = account_posts;
      res.json(newAccount);
    }
  } catch ({ message }) {
    if (currentCookie === cookieSet.length - 1) {
      currentCookie = 0;
      res.redirect(`api/instagram/profile/${username}`);
    } else {
      currentCookie += 1;
      res.redirect(`api/instagram/profile/${username}`);
    }
  }
});

route.post("/posts/track", async (req, res) => {
  const { shortcode } = req.body;

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
    display_url,
    is_video,
    view_count,
    comments_count,
    likes_count,
    shortcode
  };

  const [id] = await models.add("posts", post).returning("id");
  startCron(shortcode, id);
  res.json({ message: "it's working" });
});

route.get("/posts/track/", async (req, res) => {
  try {
    const posts = await db.raw(
      `SELECT  pt.*, p.display_url, p.shortcode  FROM posts as p INNER JOIN post_track as pt ON pt.post_id = p.id WHERE p.created_at >= NOW() - '1 day'::INTERVAL`
    );

    res.json(posts.rows);
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

route.get("/posts/track/:url", async (req, res) => {
  const { url } = req.params;

  try {
    const posts = await db.raw(
      `SELECT * FROM posts as p INNER JOIN post_track as pt ON pt.post_id = p.id WHERE p.created_at >= NOW() - '1 day'::INTERVAL AND p.shortcode ='${url}' `
    );

    res.json(posts.rows);
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

route.get("/allposts/:instagram_id", async (req, res) => {
  const { instagram_id } = req.params;

  try {
    getPosts(instagram_id);
    res.json({ message: "Fetching started", success: true });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

route.get("/post/status/:instagram_id", async (req, res) => {
  const { instagram_id } = req.params;
  try {
    const user = await models.findBy("accounts", { instagram_id });
    const status = await models
      .findAllBy("fetching", { account_id: user.id })
      .orderBy("id", "desc")
      .limit(1)
      .first();
    res.json(status);
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});
module.exports = route;
