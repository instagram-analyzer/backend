exports.up = function(knex, Promise) {
  return knex.schema.createTable("post_track", tbl => {
    tbl.increments();
    tbl.string("display_url");
    tbl.string("shortcode");
    tbl.boolean("is_video");
    tbl.integer("view_count");
    tbl.integer("taken_at_timestamp");
    tbl.integer("comments_count");
    tbl.integer("likes_count");
    tbl.timestamps(true, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("post_track");
};
