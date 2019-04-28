const json = require("express").json();
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const users = require("../routes/users");
const instagram = require("../routes/instagram");
const rateLimit = require("express-rate-limit");

const configureMiddleware = server => {
  // server.enable("trust proxy");
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000 * 24, // 24
    max: 999999999999 // limit each IP to 100 requests per windowMs
  });
  server.use(limiter);

  server.use(json);
  server.use(helmet());
  server.use(morgan("dev"));
  server.use(cors());
  server.use("/api/users", users);
  // server.use("/api/instagram", instagram);
};

module.exports = {
  configureMiddleware
};
