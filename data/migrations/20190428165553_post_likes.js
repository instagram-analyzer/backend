exports.up = function(knex, Promise) {
  return knex.schema.createTable("post_likes", tbl => {
    tbl.increments();
    tbl.string("like_id");
    tbl.string("username");
    tbl.string("profile_pic_url");
    tbl.boolean("is_verified");
    tbl
      .integer("post_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("account_posts");
    tbl.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("post_likes");
};
