exports.up = function(knex, Promise) {
  return knex.schema.createTable("accounts", tbl => {
    tbl.increments();
    tbl.string("instagram_id");
    tbl.string("username").unique();
    tbl.string("full_name");
    tbl.string("description");
    tbl.string("website");
    tbl.integer("followers");
    tbl.integer("following");
    tbl.string("added_date");
    tbl.string("last_check_date");
    tbl.string("profile_picture_url");
    tbl.boolean("is_private");
    tbl.boolean("is_verified");
    tbl.float("average_engagement_rate");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("accounts");
};
