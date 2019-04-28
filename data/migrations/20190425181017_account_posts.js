exports.up = function(knex, Promise) {
  return knex.schema.createTable("account_posts", tbl => {
    tbl.increments();
    tbl.text("caption");
    tbl.string("shortcode");
    tbl.integer("comments_count");
    tbl.integer("likes_count");
    tbl.integer("view_count");
    tbl.boolean("comments_disabled");
    tbl.string("taken_at_timestamp");
    tbl.boolean("is_video");
    tbl.string("accessibility_caption");
    tbl.float("engagment");
    tbl
      .integer("account_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("accounts");
    tbl.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("account_posts");
};