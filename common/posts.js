const axios = require("axios");
const cron = require("node-cron");
const models = require("./helpers.js");
const { cookieString, getCookie } = require("./getCookies.js");
const BASE_URL = "https://www.instagram.com/graphql/query/?";

let end_cursor;
let next_page = true;

const getPosts = async instagram_id => {
  const user = await models.findBy("accounts", { instagram_id });

  await getCookie();

  if (next_page) {
    console.log("********** GETTING POSTS AND SETTING THE NEXT PAGE *********");
    axios
      .get(
        end_cursor
          ? `${BASE_URL}query_hash=f2405b236d85e8296cf30347c9f08c2a&variables={"id":"${instagram_id}","first":50,"after":"${end_cursor}"}`
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
            getPosts(instagram_id);
          } else {
            currentCookie += 1;
            getPosts(instagram_id);
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
                engagment:
                  Math.round(
                    ((p.node.edge_media_preview_like.count +
                      p.node.edge_media_to_comment.count) /
                      user.follower_count) *
                      100
                  ) / 100,
                account_id: Number(user.id)
              });
            }
          );
        }
      })
      .then(() => getPosts(instagram_id))
      .catch(error => {
        if (error.response.status === 429) {
          console.log(
            "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
          );
          if (currentCookie === cookieSet.length - 1) {
            currentCookie = 0;
            getPosts(instagram_id);
          } else {
            currentCookie += 1;
            getPosts(instagram_id);
          }
        }
      });
  } else {
    console.log("********** THIS IS THE LAST PAGE OF POSTS *********");
    axios
      .get(
        end_cursor
          ? `${BASE_URL}query_hash=f2405b236d85e8296cf30347c9f08c2a&variables={"id":"${instagram_id}","first":50,"after":"${end_cursor}"}`
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
            getPosts(instagram_id);
          } else {
            currentCookie += 1;
            getPosts(instagram_id);
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
                engagment:
                  Math.round(
                    ((p.node.edge_media_preview_like.count +
                      p.node.edge_media_to_comment.count) /
                      user.follower_count) *
                      100
                  ) / 100,
                account_id: Number(user.id)
              });
            }
          );
        }
      })
      .then(() => {
        console.log("********** DONE GETTING ALL POSTS **********");
        // AFTER DONE WITH POSTS, GET COMMENTS AND LIKES
        // https://www.instagram.com/graphql/query/?query_id=17864450716183058

        return;
      })
      .catch(error => {
        if (error.response.status === 429) {
          console.log(
            "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
          );
          if (currentCookie === cookieSet.length - 1) {
            currentCookie = 0;
            getPosts(instagram_id);
          } else {
            currentCookie += 1;
            getPosts(instagram_id);
          }
        }
      });
  }
};

module.exports = getPosts;
