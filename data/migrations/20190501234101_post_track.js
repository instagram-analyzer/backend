exports.up = function(knex, Promise) {
  return knex.schema.createTable("post_track", tbl => {
    tbl.integer("view_count");
    tbl.integer("comments_count");
    tbl.integer("likes_count");
    tbl
      .integer("post_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("posts");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("post_track");
};
