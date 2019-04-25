exports.up = function(knex, Promise) {
  return knex.schema.createTable("top_hashtags", tbl => {
    tbl
      .integer("account_id")
      .references("id")
      .inTable("accounts");
    tbl.string("name");
    tbl.integer("count");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("top_hashtags");
};