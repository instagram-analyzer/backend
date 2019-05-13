const models = require("../common/helpers");
const db = require("../data/dbConfig");
const moment = require("moment");

const saveProfile = async profile => {
  console.log(`saving ${profile.username}'s profile`);
  //   const savedProfile = await models
  //     .findAllBy("updating_accounts", { account_username: profile.username })
  //     .where("created_at", "now() - interval '1 year'")
  //     .orderBy("created_at", "desc");

  // 2019-05-12T00:00:00Z  - 2019-05-12T11:59:00Z

  const savedProfile = await db.raw(
    `SELECT * FROM updating_accounts WHERE account_username = '${
      profile.username
    }' AND created_at >= '${moment().format(
      "YYYY-MM-DD"
    )}T00:00:00Z' AND created_at < '${moment().format(
      "YYYY-MM-DD"
    )}T23:59:00Z' ORDER BY created_at desc `
  );

  const yesterdayProfile = await db.raw(
    `SELECT * FROM updating_accounts WHERE account_username = '${
      profile.username
    }' AND created_at >= '${moment()
      .subtract(1, "days")
      .format("YYYY-MM-DD")}T00:00:00Z' AND created_at < '${moment()
      .subtract(1, "days")
      .format("YYYY-MM-DD")}T23:59:00Z' ORDER BY created_at desc `
  );

  console.log(
    savedProfile.rows[0].follower_count -
      yesterdayProfile.rows[0].follower_count
  );

  if (savedProfile.rows[0]) {
    await models.update("updating_accounts", savedProfile.rows[0].id, {
      account_bio: profile.biography,
      account_bio_url: profile.external_url,
      account_username: profile.username,
      account_image_url: profile.profile_pic_url,
      follower_count: profile.edge_followed_by.count,
      following_count: profile.edge_follow.count,
      posts_count: profile.edge_owner_to_timeline_media.count,
      instagram_id: profile.id,
      follower_growth: yesterdayProfile.rows[0]
        ? profile.edge_followed_by.count -
          yesterdayProfile.rows[0].follower_count
        : 0,
      following_growth: yesterdayProfile.rows[0]
        ? profile.edge_follow.count - yesterdayProfile.rows[0].following_count
        : 0,
      posts_growth: yesterdayProfile.rows[0]
        ? profile.edge_owner_to_timeline_media.count -
          yesterdayProfile.rows[0].posts_count
        : 0
    });
  } else {
    await models.add("updating_accounts", {
      account_bio: profile.biography,
      account_bio_url: profile.external_url,
      account_username: profile.username,
      account_image_url: profile.profile_pic_url,
      follower_count: profile.edge_followed_by.count,
      following_count: profile.edge_follow.count,
      posts_count: profile.edge_owner_to_timeline_media.count,
      instagram_id: profile.id,
      follower_growth: 0,
      following_growth: 0,
      posts_growth: 0
    });
  }
};

module.exports = saveProfile;
