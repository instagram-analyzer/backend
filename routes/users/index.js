const route = require("express").Router();
const axios = require("axios");
const cron = require("node-cron");
const models = require("../../common/helpers.js");
const { cookieSet } = require("./cookie");
const BASE_URL = "https://www.instagram.com/graphql/query/?";

// const getFollowers = require("./getFollowers");

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
          // average_views: postsLength ? Math.round(aveViews * 100) / 100 : 0,
          total_engagement: postsLength ? totalEngagment : 0,
          posts_count:
            result.data.graphql.user.edge_owner_to_timeline_media.count
        })
        .returning("id");

      newAccount = await models.findBy("accounts", { id: addAccount });

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
    });

  return newAccount;
}

const startCronJob = username => {
  cron.schedule("0-59/1 * * * * *", () => {
    console.log("Fetching user account");
    fetchUser(username);
  });
};

axios.defaults.withCredentials = true;

// const proxy = {
//   host: "190.202.24.66",
//   port: 3128
//   // auth: {
//   //   username: 'some_login',
//   //   password: 'some_pass'
//   // }
// };

let startCron = true;

route.get("/profile/:username", async (req, res) => {
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
          // average_views: postsLength ? Math.round(aveViews * 100) / 100 : 0,
          total_engagement: postsLength ? totalEngagment : 0,
          posts_count:
            result.data.graphql.user.edge_owner_to_timeline_media.count
        })
        .returning("id");

      newAccount = await models.findBy("accounts", { id: addAccount });

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
      startCron && startCronJob(username);
      startCron = false;
      res.json(newAccount);
    });
});

route.get("/post/:instagram_id", async (req, res) => {
  const { instagram_id } = req.params;
  const user = await models.findBy("accounts", { instagram_id });
  let end_cursor;
  let next_page = true;

  const getPosts = async () => {
    await getCookie();

    if (next_page) {
      console.log(
        "********** GETTING POSTS AND SETTING THE NEXT PAGE *********"
      );
      axios
        .get(
          end_cursor
            ? `${BASE_URL}query_hash=f2405b236d85e8296cf30347c9f08c2a&variables={"id":"${instagram_id}","first":12,"after":"${end_cursor}"}`
            : `${BASE_URL}query_hash=f2405b236d85e8296cf30347c9f08c2a&variables={"id":"${instagram_id}","first":50}`,
          {
            headers: {
              Cookie: cookieString
            }
          }
        )
        .then(async result => {
          if (result.data.status === "fail") {
            console.log(
              "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
            );
            if (currentCookie === cookieSet.length - 1) {
              currentCookie = 0;
              getPosts();
            } else {
              currentCookie += 1;
              getPosts();
            }
          } else {
            next_page =
              result.data.data.user.edge_owner_to_timeline_media.page_info
                .has_next_page;

            end_cursor =
              result.data.data.user.edge_owner_to_timeline_media.page_info
                .end_cursor;

            await result.data.data.user.edge_owner_to_timeline_media.edges.map(
              async p => {
                await models.add("account_posts", {
                  display_url: p.node.display_url,
                  is_video: p.node.is_video,
                  video_url: p.node.is_video ? p.node.video_url : null,
                  video_view_count: p.node.is_video
                    ? p.node.video_view_count
                    : null,
                  caption: p.node.edge_media_to_caption.edges.length
                    ? p.node.edge_media_to_caption.edges[0].node.text
                    : null,
                  shortcode: p.node.shortcode,
                  taken_at_timestamp: p.node.taken_at_timestamp,
                  comments_count: p.node.edge_media_to_comment.count,
                  likes_count: p.node.edge_media_preview_like.count,
                  view_count: p.node.is_video ? p.node.video_view_count : null,
                  comments_disabled: p.node.comments_disabled,
                  accessibility_caption: p.node.accessibility_caption,
                  engagment: Math.floor(
                    ((p.node.edge_media_preview_like.count +
                      (p.node.edge_media_to_comment.count /
                        user.follower_count) *
                        100) /
                      100) *
                      100
                  ),
                  account_id: Number(user.id)
                });
              }
            );
          }
        })
        .then(() => getPosts())
        .catch(error => {
          if (error.response.status === 429) {
            console.log(
              "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
            );
            if (currentCookie === cookieSet.length - 1) {
              currentCookie = 0;
              getPosts();
            } else {
              currentCookie += 1;
              getPosts();
            }
          }
        });
    } else {
      console.log("********** THIS IS THE LAST PAGE OF POSTS *********");
      axios
        .get(
          end_cursor
            ? `${BASE_URL}query_hash=f2405b236d85e8296cf30347c9f08c2a&variables={"id":"${instagram_id}","first":12,"after":"${end_cursor}"}`
            : `${BASE_URL}query_hash=f2405b236d85e8296cf30347c9f08c2a&variables={"id":"${instagram_id}","first":50}`,
          {
            headers: {
              Cookie: cookieString
            }
          }
        )
        .then(async result => {
          if (result.data.status === "fail") {
            console.log(
              "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
            );
            if (currentCookie === cookieSet.length - 1) {
              currentCookie = 0;
              getPosts();
            } else {
              currentCookie += 1;
              getPosts();
            }
          } else {
            next_page =
              result.data.data.user.edge_owner_to_timeline_media.page_info
                .has_next_page;

            end_cursor =
              result.data.data.user.edge_owner_to_timeline_media.page_info
                .end_cursor;

            await result.data.data.user.edge_owner_to_timeline_media.edges.map(
              async p => {
                await models.add("account_posts", {
                  display_url: p.node.display_url,
                  is_video: p.node.is_video,
                  video_url: p.node.is_video ? p.node.video_url : null,
                  video_view_count: p.node.is_video
                    ? p.node.video_view_count
                    : null,
                  caption: p.node.edge_media_to_caption.edges.length
                    ? p.node.edge_media_to_caption.edges[0].node.text
                    : null,
                  shortcode: p.node.shortcode,
                  taken_at_timestamp: p.node.taken_at_timestamp,
                  comments_count: p.node.edge_media_to_comment.count,
                  likes_count: p.node.edge_media_preview_like.count,
                  view_count: p.node.is_video ? p.node.video_view_count : null,
                  comments_disabled: p.node.comments_disabled,
                  accessibility_caption: p.node.accessibility_caption,
                  engagment: Math.floor(
                    ((p.node.edge_media_preview_like.count +
                      (p.node.edge_media_to_comment.count /
                        user.follower_count) *
                        100) /
                      100) *
                      100
                  ),
                  account_id: Number(user.id)
                });
              }
            );
          }
        })
        .then(() => {
          console.log("********** DONE GETTING ALL POSTS **********");
          return;
        })
        .catch(error => {
          if (error.response.status === 429) {
            console.log(
              "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
            );
            if (currentCookie === cookieSet.length - 1) {
              currentCookie = 0;
              getPosts();
            } else {
              currentCookie += 1;
              getPosts();
            }
          }
        });
    }
  };

  try {
    console.log(
      `************************** STARTING SCRAPE JOB FOR ${
        user.account_username
      } ***********************************`
    );
    getPosts();

    res.json({ message: "Scraping has started bro" });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

route.get("/followers/:instagram_id", async (req, res, next) => {
  const { instagram_id } = req.params;
  const user = await models.findBy("accounts", { instagram_id });
  let end_cursor;
  let next_page = true;

  const getFollowers = async () => {
    await getCookie();
    if (next_page) {
      console.log(
        "********** GETTING FOLLOWERS AND SETTING THE NEXT PAGE *********"
      );
      axios
        .get(
          end_cursor
            ? `${BASE_URL}query_hash=56066f031e6239f35a904ac20c9f37d9&variables={"id":"${instagram_id}","first":50, "after": "${end_cursor}"}`
            : `${BASE_URL}query_hash=56066f031e6239f35a904ac20c9f37d9&variables={"id":"${instagram_id}","first":50}`,
          {
            headers: {
              Cookie: cookieString
            }
          }
        )
        .then(async result => {
          if (result.data.status === "fail") {
            console.log(
              "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
            );
            if (currentCookie === cookieSet.length - 1) {
              currentCookie = 0;
              getFollowers();
            } else {
              currentCookie += 1;
              getFollowers();
            }
            // setTimeout(() => {
            //   console.log("********** FINISHING WHAT WE STARTED *********");
            //   getFollowers();
            // }, 1000 * 60 * 5);
          } else {
            next_page =
              result.data.data.user.edge_followed_by.page_info.has_next_page;

            end_cursor =
              result.data.data.user.edge_followed_by.page_info.end_cursor;

            await result.data.data.user.edge_followed_by.edges.map(async f => {
              await models.add("followers", {
                instagram_id: f.node.id,
                username: f.node.username,
                full_name: f.node.full_name,
                profile_pic_url: f.node.profile_pic_url,
                is_private: f.node.is_private,
                is_verified: f.node.is_verified,
                account_id: Number(user.id)
              });
            });
          }
        })
        .then(() => getFollowers())
        .catch(error => {
          if (error.response.status === 429) {
            console.log(
              "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
            );
            if (currentCookie === cookieSet.length - 1) {
              currentCookie = 0;
              getFollowers();
            } else {
              currentCookie += 1;
              getFollowers();
            }
            // setTimeout(() => {
            //   console.log("********** FINISHING WHAT WE STARTED *********");
            //   getFollowers();
            // }, 1000 * 60 * 5);
          }
        });
    } else {
      console.log("********** THIS IS THE LAST PAGE OF FOLLOWERS *********");
      axios
        .get(
          end_cursor
            ? `${BASE_URL}query_hash=56066f031e6239f35a904ac20c9f37d9&variables={"id":"${instagram_id}","first":50, "after": "${end_cursor}"}`
            : `${BASE_URL}query_hash=56066f031e6239f35a904ac20c9f37d9&variables={"id":"${instagram_id}","first":50}`,
          {
            headers: {
              Cookie: cookieString
            }
          }
        )
        .then(async result => {
          if (result.data.status === "fail") {
            console.log(
              "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
            );

            if (currentCookie === cookieSet.length - 1) {
              currentCookie = 0;
              getFollowers();
            } else {
              currentCookie += 1;
              getFollowers();
            }
            // setTimeout(() => {
            //   console.log("********** FINISHING WHAT WE STARTED *********");
            //   getFollowers();
            // }, 1000 * 60 * 5);
          } else {
            console.log(
              "********** THIS IS THE LAST OF THE FOLLOWERS *********"
            );
            if (
              !result.data.data.user.edge_followed_by.page_info.has_next_page
            ) {
              next_page = false;
              end_cursor = null;
              await result.data.data.user.edge_followed_by.edges.map(
                async f => {
                  await models.add("followers", {
                    instagram_id: f.node.id,
                    username: f.node.username,
                    full_name: f.node.full_name,
                    profile_pic_url: f.node.profile_pic_url,
                    is_private: f.node.is_private,
                    is_verified: f.node.is_verified,
                    account_id: Number(user.id)
                  });
                }
              );
            }

            return;
          }
        })
        .then(() => {
          console.log("********** DONE GETTING ALL FOLLOWERS **********");
          return;
        })
        .catch(error => {
          if (error.response.status === 429) {
            console.log(
              "*********** WAITING 5 MINS BECAUSE OF INSTAGRAM RATE LIMITING ********"
            );
            if (currentCookie === cookieSet.length - 1) {
              currentCookie = 0;
              getFollowers();
            } else {
              currentCookie += 1;
              getFollowers();
            }
            // setTimeout(() => {
            //   console.log("*********** LETS TRY AGAIN ***********");
            //   getFollowers();
            // }, 1000 * 60 * 5);
          }
        });
    }
  };

  try {
    console.log(
      `************************** STARTING SCRAPE JOB FOR ${
        user.account_username
      } ***********************************`
    );
    getFollowers();

    res.json({ message: "Scraping has started bro" });
  } catch ({ message }) {
    res.status(500).json({ message });
  }

  // let followers = [];
  // let end_cursor;
  //
  // async function instagram() {
  //   const queryInstagram = await axios.get(
  //     end_cursor
  //       ? `https://www.instagram.com/graphql/query/?query_hash=56066f031e6239f35a904ac20c9f37d9&variables={"id":"${instagram_id}","first":50, "after": "${end_cursor}"}`
  //       : `https://www.instagram.com/graphql/query/?query_hash=56066f031e6239f35a904ac20c9f37d9&variables={"id":"${instagram_id}","first":50}`,
  //     {
  //       headers: {
  //         Cookie: cookieString
  //       }
  //     }
  //   );
  //
  //   return queryInstagram;
  // }
  //
  // const instagramData = await instagram();
  //
  // if (instagramData.data.data.user.edge_followed_by.page_info.has_next_page) {
  //   await instagramData.data.data.user.edge_followed_by.edges.map(async f => {
  //     await followers.push({
  //       instagram_id: f.node.id,
  //       username: f.node.username,
  //       full_name: f.node.full_name,
  //       profile_pic_url: f.node.profile_pic_url,
  //       is_private: f.node.is_private,
  //       is_verified: f.node.is_verified,
  //       account_id: user.id
  //     });
  //   });
  //
  //   const follower = await models.add("followers", followers);
  //   end_cursor =
  //     instagramData.data.data.user.edge_followed_by.page_info.end_cursor;
  //
  //   return instagramData;
  // } else {
  //   await instagramData.data.data.user.edge_followed_by.edges.map(async f => {
  //     await followers.push({
  //       instagram_id: f.node.id,
  //       username: f.node.username,
  //       full_name: f.node.full_name,
  //       profile_pic_url: f.node.profile_pic_url,
  //       is_private: f.node.is_private,
  //       is_verified: f.node.is_verified,
  //       account_id: user.id
  //     });
  //   });
  //
  //   const follower = await models.add("followers", followers);
  // }
  //
  // const followersList = await models.findAllBy("followers", {
  //   account_id: user.id
  // });
  // res.json(followersList);
});

route.get("/account/stats/:instagram_id", async (req, res) => {
  const { instagram_id } = req.params;

  try {
    const accountStats = await models.findAllBy("accounts", { instagram_id });
    res.json(accountStats);
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});
module.exports = route;
