const models = require("../common/helpers");

const saveProfile = async profile => {
  console.log(`saving ${profile.username}'s profile`);
  await models.add("updating_accounts", {
    account_bio: profile.biography,
    account_bio_url: profile.external_url,
    account_username: profile.username,
    account_image_url: profile.profile_pic_url,
    follower_count: profile.edge_followed_by.count,
    following_count: profile.edge_follow.count,
    posts_count: profile.edge_owner_to_timeline_media.count,
    instagram_id: profile.id
  });
};

module.exports = saveProfile;
