const axios = require("axios");
const cron = require("node-cron");
const models = require("./helpers.js");
const { cookieString, getCookie } = require("./getCookies.js");
const BASE_URL = "https://www.instagram.com/graphql/query/?";

let end_cursor;
let next_page = true;

const getFollowers = async instagram_id => {
  const user = await models.findBy("accounts", { instagram_id });
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
            getFollowers(instagram_id);
          } else {
            currentCookie += 1;
            getFollowers(instagram_id);
          }
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
      .then(() => getFollowers(instagram_id))
      .catch(error => {
        if (error.response.status === 429) {
          console.log(
            "********** WE'RE SWITCHING ACCOUNTS AND TRYING AGAIN *********"
          );
          if (currentCookie === cookieSet.length - 1) {
            currentCookie = 0;
            getFollowers(instagram_id);
          } else {
            currentCookie += 1;
            getFollowers(instagram_id);
          }
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
            getFollowers(instagram_id);
          } else {
            currentCookie += 1;
            getFollowers(instagram_id);
          }
        } else {
          console.log("********** THIS IS THE LAST OF THE FOLLOWERS *********");
          if (!result.data.data.user.edge_followed_by.page_info.has_next_page) {
            next_page = false;
            end_cursor = null;
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
            getFollowers(instagram_id);
          } else {
            currentCookie += 1;
            getFollowers(instagram_id);
          }
        }
      });
  }
};

module.exports = getFollowers;
