exports.up = function(knex, Promise) {
  return knex.schema.createTable("updating_accounts", tbl => {
    tbl.increments();
    tbl.string("account_bio");
    tbl.string("account_bio_url");
    tbl.string("account_username");
    tbl.string("account_image_url");
    tbl.integer("follower_count");
    tbl.integer("following_count");
    tbl.integer("hightlight_reel_count");
    tbl.string("full_name");
    tbl.boolean("is_business_account");
    tbl.string("business_category_name");
    tbl.boolean("is_private");
    tbl.boolean("is_verified");
    tbl.boolean("is_joined_recently");
    tbl.integer("posts_count");
    tbl.float("average_likes");
    tbl.float("average_comments");
    tbl.float("average_views");
    tbl.float("total_engagement");
    tbl.string("instagram_id");
    tbl.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("updating_accounts");
};
