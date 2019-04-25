exports.up = function(knex, Promise) {
  return knex.schema.createTable("media", tbl => {
    tbl.increments();
    tbl
      .integer("account_id")
      .references("id")
      .inTable("accounts");

    tbl.string("media_id");
    tbl.string("instagram_user_id");
    tbl.string("shortcode");
    tbl.string("created_date");
    tbl.string("caption");
    tbl.integer("comments");
    tbl.integer("likes");
    tbl.string("media_url");
    tbl.string("media_image_url");
    tbl.string("type");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("media");
};
