exports.up = function(knex, Promise) {
  return knex.schema.createTable("media_mentions", tbl => {
    tbl.increments();
    tbl
      .integer("media_id")
      .references("id")
      .inTable("media")
      .nullable();
    tbl.string("mention");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("media_mentions");
};
