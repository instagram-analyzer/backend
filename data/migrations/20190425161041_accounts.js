exports.up = function(knex, Promise) {
  return knex.schema.createTable("accounts", tbl => {
    tbl.increments();
    tbl.string("account_bio");
    tbl.string("account_bio_url");
    tbl.string("account_username");
    tbl.string("account_image_url");
    tbl.string("follower_count");
    tbl.string("following_count");
    tbl.string("hightlight_reel_count");
    tbl.string("full_name");
    tbl.boolean("is_business_account");
    tbl.string("business_category_name");
    tbl.boolean("is_private");
    tbl.boolean("is_verified");
    tbl.boolean("is_joined_recently");
    tbl.string("posts_count");
    tbl.float("average_likes");
    tbl.float("average_comments");
    tbl.float("average_views");
    tbl.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("accounts");
};
