exports.up = function(knex, Promise) {
  return knex.schema.createTable("account_details", tbl => {
    tbl
      .integer("account_id")
      .references("id")
      .inTable("accounts");
    tbl.string("total_likes");
    tbl.string("total_comments");
    tbl.string("average_likes");
    tbl.string("average_comments");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("account_details");
};
