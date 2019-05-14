const models = require("../common/helpers");
const db = require("../data/dbConfig");
const moment = require("moment-timezone");

const saveProfile = async profile => {
  const savedProfile = await db.raw(
    `SELECT * FROM updating_accounts WHERE account_username = '${
      profile.username
    }' AND created_at >= '${moment()
      .tz("Etc/GMT")
      .format("YYYY-MM-DD")}T00:00:00Z' AND created_at < '${moment()
      .tz("Etc/GMT")
      .format("YYYY-MM-DD")}T23:59:00Z' `
  );

  const yesterdayProfile = await db.raw(
    `SELECT * FROM updating_accounts WHERE account_username = '${
      profile.username
    }' AND created_at >= '${moment()
      .tz("Etc/GMT")
      .subtract(1, "days")
      .format("YYYY-MM-DD")}T00:00:00Z' AND created_at < '${moment()
      .tz("Etc/GMT")
      .subtract(1, "days")
      .format("YYYY-MM-DD")}T23:59:00Z' ORDER BY created_at desc `
  );

  if (savedProfile.rows[0]) {
    console.log(`updating ${profile.username}'s profile`);

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
    console.log(`saving ${profile.username}'s profile`);

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
