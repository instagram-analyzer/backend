exports.up = function(knex, Promise) {
  return knex.schema.createTable("post_comments", tbl => {
    tbl.increments();
    tbl.string("comment_id");
    tbl.string("text");
    tbl.string("created_timestamp");
    tbl.string("owner_id");
    tbl.string("profile_pic_url");
    tbl.string("username");
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
  return knex.schema.dropTableIfExists("post_comments");
};
