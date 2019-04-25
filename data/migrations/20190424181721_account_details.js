exports.up = function(knex, Promise) {
  return knex.schema.createTable("account_details", tbl => {
    tbl
      .integer("account_id")
      .references("id")
      .inTable("accounts");
    tbl.integer("total_likes");
    tbl.integer("total_comments");
    tbl.float("average_likes");
    tbl.float("average_comments");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("account_details");
};
