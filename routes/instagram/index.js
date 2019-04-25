const route = require("express").Router();
const models = require("../../common/helpers");
const axios = require("axios");

route.post("/", async (req, res) => {
  const { username } = req.body;
  try {
    const ping = await axios.get(
      `https://instaanalyzer.com/report/${username}/instagram`
    );

    const getStats = await axios.get(
      `https://instaanalyzer.com/api?api_key=0&username=${username}&source=instagram`
    );

    const data = getStats.data;

    const exists = await models.findBy("accounts", { username });
    if (exists) {
      const update = await models.update("accounts", exists.id, {
        instagram_id: data.instagram_id,
        username: data.username,
        full_name: data.full_name,
        description: data.description,
        website: data.website,
        followers: Number(data.followers),
        following: Number(data.following),
        added_date: data.added_date,
        last_check_date: data.last_check_date,
        profile_picture_url: data.profile_picture_url,
        is_private: Number(data.is_private),
        is_verified: Number(data.is_verified),
        average_engagement_rate: data.average_engagement_rate
      });

      if (data.details) {
        const updateAccountDetails = await models.updateAccount(
          "account_details",
          exists.id,
          {
            total_likes: data.details.total_likes,
            total_comments: data.details.total_comments,
            average_likes: data.details.average_likes,
            average_comments: data.details.average_comments
          }
        );

        if (update) {
          const account = await models.findBy("accounts", { id: exists.id });
          const accountDetails = await models.findBy("account_details", {
            account_id: exists.id
          });
          account.details = accountDetails;

          res.status(201).json(account);
        } else {
          res.status(400).json({ message: "Failed to add to database" });
        }
      } else {
        const account = await models.findBy("accounts", { id: exists.id });
        const accountDetails = await models.findBy("account_details", {
          account_id: exists.id
        });
        account.details = accountDetails;
        res.status(200).json(account);
      }
    } else {
      const [addAccount] = await models
        .add("accounts", {
          instagram_id: data.instagram_id,
          username: data.username,
          full_name: data.full_name,
          description: data.description,
          website: data.website,
          followers: Number(data.followers),
          following: Number(data.following),
          added_date: data.added_date,
          last_check_date: data.last_check_date,
          profile_picture_url: data.profile_picture_url,
          is_private: Number(data.is_private),
          is_verified: Number(data.is_verified),
          average_engagement_rate: data.average_engagement_rate
        })
        .returning("id");

      if (data.details) {
        const [addAccountDetails] = await models.add("account_details", {
          account_id: addAccount,
          total_likes: data.details.total_likes,
          total_comments: data.details.total_comments,
          average_likes: data.details.average_likes,
          average_comments: data.details.average_comments
        });
        if (addAccount) {
          const account = await models.findBy("accounts", { id: addAccount });
          const accountDetails = await models.findBy("account_details", {
            account_id: addAccount
          });
          account.details = accountDetails;
          res.status(201).json(account);
        } else {
          res.status(400).json({ message: "Failed to add to database" });
        }
      } else {
        const account = await models.findBy("accounts", { id: addAccount });
        const accountDetails = await models.findBy("account_details", {
          account_id: addAccount
        });
        account.details = accountDetails;
        res.status(201).json(account);
      }
    }
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

module.exports = route;
