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

module.exports = { cookieString, getCookie };
