const axios = require("axios");
const cron = require("node-cron");
const models = require("./helpers.js");
// const { cookieString, getCookie, currentCookie } = require("./getCookies.js");
const { cookieSet } = require("./cookie");

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

function fetchUser(username) {
  let newAccount;

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

        // let totalViews = await posts
        //   .filter(p => p.node.is_video)
        //   .map(p => {
        //     return p.node.video_view_count;
        //   })
        //   .reduce((a, b) => a + b);

        // let videoCount = await posts.filter(p => p.node.is_video).length;

        totalEngagment =
          Math.round(
            ((totalLikes + totalComments) /
              result.data.graphql.user.edge_followed_by.count) *
              100
          ) / 100;
        aveLikes = totalLikes / postsLength;
        aveComments = totalComments / postsLength;
        // aveViews = totalViews / videoCount;
      }

      const [addAccount] = await models
        .add("updating_accounts", {
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
          // average_views: postsLength ? Math.round(aveViews * 100) / 100 : 0,
          total_engagement: postsLength ? totalEngagment : 0,
          posts_count:
            result.data.graphql.user.edge_owner_to_timeline_media.count
        })
        .returning("id");
    })
    .catch(error => {
      if (error.response.status === 429) {
        console.log(
          "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
        );
        if (currentCookie === cookieSet.length - 1) {
          currentCookie = 0;
          fetchUser(username);
        } else {
          currentCookie += 1;
          fetchUser(username);
        }
      }
    });

  return newAccount;
}

module.exports = fetchUser;
