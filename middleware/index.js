const json = require("express").json();
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const users = require("../routes/users");
const instagram = require("../routes/instagram");

const configureMiddleware = server => {
  server.use(json);
  server.use(helmet());
  server.use(morgan("dev"));
  server.use(cors());
  server.use("/api/users", users);
  server.use("/api/instagram", instagram);
};

module.exports = {
  configureMiddleware
};
