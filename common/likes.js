const axios = require("axios");
const cron = require("node-cron");
const models = require("./helpers.js");
const { cookieString, getCookie } = require("./getCookies.js");
const BASE_URL = "https://www.instagram.com/graphql/query/?";

let end_cursor;
let next_page = true;

const getPost = async instagram_id => {
  const user = await models.findBy("accounts", { instagram_id });

  await getCookie();

  // axios
  //   .get(
  //     end_cursor
  //       ? `${BASE_URL}query_hash=17864450716183058&variables={"id":"${instagram_id}","first":50,"after":"${end_cursor}"}`
  //       : `${BASE_URL}query_hash=17864450716183058&variables={"id":"${instagram_id}","first":50}`,
  //     {
  //       headers: {
  //         Cookie: cookieString
  //       }
  //     }
  //   )
  //   .then(likes => {
  //     console.log(likes.data);
  //   });
};
