const axios = require("axios");
const models = require("../../common/helpers");

const BASE_URL =
  "https://www.instagram.com/graphql/query/?query_hash=56066f031e6239f35a904ac20c9f37d9&variables=";

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

module.exports = getFollowers;
