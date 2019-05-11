const { cookieSet } = require("./cookie");

let cookieString = "";
let currentCookie = 0;

const getCookie = () => {
  console.log("COOKIE NUMBER", currentCookie);
  cookieString = "";
  let cookieNames = [];
  //"cookie1=value; cookie2=value; cookie3=value;"
  const cookies = cookieSet[
    currentCookie === cookieSet.length - 1 ? 0 : currentCookie + 1
  ].map(cookie => {
    cookieNames.push({ name: cookie.name, value: cookie.value });
  });

  cookieNames.map(cookie => {
    cookieString += `${cookie.name}=${cookie.value}; `;
  });
};

getCookie();

module.exports = { cookieString, getCookie, currentCookie };
