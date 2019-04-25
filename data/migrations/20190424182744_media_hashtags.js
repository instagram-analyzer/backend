exports.up = function(knex, Promise) {
  return knex.schema.createTable("media_hashtags", tbl => {
    tbl.increments();
    tbl
      .integer("media_id")
      .references("id")
      .inTable("media")
      .nullable();
    tbl.string("hashtag");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("media_hashtags");
};
