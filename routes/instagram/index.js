const route = require("express").Router();
const { authenticate } = require("../../common/authentication.js");
const models = require("../../common/helpers");
const db = require("../../data/dbConfig");
const { cookieString } = require("../../common/getCookies.js");
const startProfileUpdateCron = require("../../common/updateProfileCron.js");
const getFollowers = require("../../common/followers.js");
const getPosts = require("../../common/posts.js");
const axios = require("axios");
const trackPost = require("../../common/trackPost.js");

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

      if (!localPosts.length) {
        await posts.map(async post => {
          const addPosts = await models.add("account_posts", {
            caption: post.node.edge_media_to_caption.edges.length
              ? post.node.edge_media_to_caption.edges[0].node.text
              : "",
            display_url: post.node.display_url,
            shortcode: post.node.shortcode,
            comments_count: post.node.edge_media_to_comment.count,
            likes_count: post.node.edge_liked_by.count,
            view_count: post.node.is_video ? post.node.video_view_count : 0,
            comments_disabled: post.node.comments_disabled,
            taken_at_timestamp: post.node.taken_at_timestamp,
            is_video: post.node.is_video,
            accessibility_caption: post.node.accessibility_caption,
            account_id: account.id,
            engagment:
              Math.round(
                ((post.node.edge_liked_by.count +
                  post.node.edge_media_to_comment.count) /
                  newAccount.follower_count) *
                  100 *
                  100
              ) / 100
          });
        });
      } else {
        await localPosts.map(async (post, i) => {
          const updatePosts = await models.update(
            "account_posts",
            localPosts[i].id,
            {
              caption: posts[i].node.edge_media_to_caption.edges.length
                ? posts[i].node.edge_media_to_caption.edges[0].node.text
                : "",
              display_url: posts[i].node.display_url,
              shortcode: posts[i].node.shortcode,
              comments_count: posts[i].node.edge_media_to_comment.count,
              likes_count: posts[i].node.edge_liked_by.count,
              view_count: posts[i].node.is_video
                ? posts[i].node.video_view_count
                : 0,
              comments_disabled: posts[i].node.comments_disabled,
              taken_at_timestamp: posts[i].node.taken_at_timestamp,
              is_video: posts[i].node.is_video,
              accessibility_caption: posts[i].node.accessibility_caption,
              account_id: account.id,
              engagment:
                Math.round(
                  ((posts[i].node.edge_liked_by.count +
                    posts[i].node.edge_media_to_comment.count) /
                    account.follower_count) *
                    100 *
                    100
                ) / 100
            }
          );
        });
      }

      const account_posts = await models.findAllBy("account_posts", {
        account_id: account.id
      });

      newAccount.posts = account_posts;
      // startCron && startCronJob(username);
      startCron = false;
      res.json(newAccount);
    } else {
      startProfileUpdateCron(username);
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

      await posts.map(async post => {
        const addPosts = await models.add("account_posts", {
          caption: post.node.edge_media_to_caption.edges.length
            ? post.node.edge_media_to_caption.edges[0].node.text
            : "",
          display_url: post.node.display_url,
          shortcode: post.node.shortcode,
          comments_count: post.node.edge_media_to_comment.count,
          likes_count: post.node.edge_liked_by.count,
          view_count: post.node.is_video ? post.node.video_view_count : 0,
          comments_disabled: post.node.comments_disabled,
          taken_at_timestamp: post.node.taken_at_timestamp,
          is_video: post.node.is_video,
          accessibility_caption: post.node.accessibility_caption,
          account_id: addAccount,
          engagment:
            Math.round(
              ((post.node.edge_liked_by.count +
                post.node.edge_media_to_comment.count) /
                newAccount.follower_count) *
                100 *
                100
            ) / 100
        });
      });

      const account_posts = await models.findAllBy("account_posts", {
        account_id: addAccount
      });

      newAccount.posts = account_posts;
      res.json(newAccount);
    }
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

route.post("/posts/track", async (req, res) => {
  const { shortcode } = req.body;

  trackPost(shortcode);
  res.json({ message: "it's working" });
});

route.get("/posts/track/", async (req, res) => {
  try {
    const posts = await db.raw(
      `SELECT * FROM posts as p INNER JOIN post_track as pt ON pt.post_id = p.id WHERE p.created_at >= NOW() - '1 day'::INTERVAL`
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
      `SELECT * FROM posts as p INNER JOIN post_track as pt ON pt.post_id = p.id WHERE p.created_at >= NOW() - '1 day'::INTERVAL AND p.shortcode = ${url} `
    );

    res.json(posts);
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});
module.exports = route;
