const route = require("express").Router();
const axios = require("axios");
const models = require("../../common/helpers.js");
const { cookie } = require("./cookie");

axios.defaults.withCredentials = true;

let cookieNames = [];
//"cookie1=value; cookie2=value; cookie3=value;"
const cookies = cookie.map(cookie => {
  cookieNames.push({ name: cookie.name, value: cookie.value });
});

let cookieString = "";

cookieNames.map(cookie => {
  cookieString += `${cookie.name}=${cookie.value}; `;
});

route.get("/profile/:username", (req, res) => {
  const { username } = req.params;

  axios
    .get(`https://www.instagram.com/${username}/?__a=1`, {
      headers: {
        Cookie: cookieString
      }
    })
    .then(async result => {
      const posts = result.data.graphql.user.edge_owner_to_timeline_media.edges;
      const postsLength = posts.length;
      let aveLikes;
      let aveComments;
      let aveViews;
      let totalEngagment;

      if (postsLength) {
        let totalLikes = await posts
          .map(p => {
            return p.node.edge_liked_by.count;
          })
          .reduce((a, b) => a + b);

        let totalComments = await posts
          .map(p => {
            return p.node.edge_media_to_comment.count;
          })
          .reduce((a, b) => a + b);

        let totalViews = await posts
          .filter(p => p.node.is_video)
          .map(p => {
            return p.node.video_view_count;
          })
          .reduce((a, b) => a + b);

        let videoCount = await posts.filter(p => p.node.is_video).length;

        totalEngagment =
          Math.round(
            ((totalLikes + totalComments) /
              result.data.graphql.user.edge_followed_by.count) *
              100
          ) / 100;
        aveLikes = totalLikes / postsLength;
        aveComments = totalComments / postsLength;
        aveViews = totalViews / videoCount;
      }

      const [addAccount] = await models
        .add("accounts", {
          instagram_id: result.data.graphql.user.id,
          account_bio: result.data.graphql.user.biography,
          account_bio_url: result.data.graphql.user.external_url,
          account_username: result.data.graphql.user.username,
          account_image_url: result.data.graphql.user.profile_pic_url_hd,
          follower_count: result.data.graphql.user.edge_followed_by.count,
          following_count: result.data.graphql.user.edge_follow.count,
          hightlight_reel_count: result.data.graphql.user.highlight_reel_count,
          full_name: result.data.graphql.user.full_name,
          is_verified: result.data.graphql.user.is_verified,
          is_business_account: result.data.graphql.user.is_business_account,
          business_category_name:
            result.data.graphql.user.business_category_name,
          is_private: result.data.graphql.user.is_private,
          is_joined_recently: result.data.graphql.user.is_joined_recently,
          average_likes: postsLength ? Math.round(aveLikes * 100) / 100 : 0,
          average_comments: postsLength
            ? Math.round(aveComments * 100) / 100
            : 0,
          average_views: postsLength ? Math.round(aveViews * 100) / 100 : 0,
          total_engagement: postsLength ? totalEngagment : 0,
          posts_count:
            result.data.graphql.user.edge_owner_to_timeline_media.count
        })
        .returning("id");

      const newAccount = await models.findBy("accounts", { id: addAccount });

      await posts.map(async post => {
        const addPosts = await models.add("account_posts", {
          caption: post.node.edge_media_to_caption.edges.length
            ? post.node.edge_media_to_caption.edges[0].node.text
            : "",
          shortcode: post.node.shortcode,
          comments_count: post.node.edge_media_to_comment.count,
          likes_count: post.node.edge_liked_by.count,
          view_count: post.node.edge_media_preview_like.count,
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
    })
    .catch(() => {
      res.json({ message: "Broken" });
    });
});

route.get("/post/:post", (req, res) => {
  const { post } = req.params;

  axios
    .get(`https://www.instagram.com/p/${post}/?__a=1`, {
      headers: {
        Cookie: cookieString
      }
    })
    .then(result => res.json({ post: result.data }))
    .catch(() => {
      res.json({ message: "Broken" });
    });
});

route.get("/followers/:instagram_id", async (req, res) => {
  const { instagram_id } = req.params;
  const user = await models.findBy("accounts", { instagram_id });
  console.log(user);
  let end_cursor;

  async function getFollowers() {
    const queryInstagram = await axios.get(
      end_cursor
        ? `https://www.instagram.com/graphql/query/?query_hash=56066f031e6239f35a904ac20c9f37d9&variables={"id":"${instagram_id}","first":50, "after": "${end_cursor}"}`
        : `https://www.instagram.com/graphql/query/?query_hash=56066f031e6239f35a904ac20c9f37d9&variables={"id":"${instagram_id}","first":50}`,
      {
        headers: {
          Cookie: cookieString
        }
      }
    );
    await queryInstagram.data.data.user.edge_followed_by.edges.map(async f => {
      const follower = await models.add("followers", {
        instagram_id: f.node.id,
        username: f.node.username,
        full_name: f.node.full_name,
        profile_pic_url: f.node.profile_pic_url,
        is_private: f.node.is_private,
        is_verified: f.node.is_verified,
        account_id: user.id
      });
    });

    if (
      queryInstagram.data.data.user.edge_followed_by.page_info.has_next_page
    ) {
      end_cursor =
        queryInstagram.data.data.user.edge_followed_by.page_info.end_cursor;
      getFollowers();
    } else {
      const followersList = await models.findAllBy("followers", {
        account_id: user.id
      });
      res.json(followersList);
    }
  }

  getFollowers();
});

module.exports = route;
