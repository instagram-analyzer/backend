const models = require("./helpers");
const db = require("../data/dbConfig");
const axios = require("axios");
const { cookieString } = require("./getCookies.js");

let newAccount;
const getProfile = async username => {
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

  const posts = getProfile.data.graphql.user.edge_owner_to_timeline_media.edges;
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
      hightlight_reel_count: getProfile.data.graphql.user.highlight_reel_count,
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
        average_comments: postsLength ? Math.round(aveComments * 100) / 100 : 0,
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
};

module.exports = {
  getProfile
};
