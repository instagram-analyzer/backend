exports.up = function(knex, Promise) {
  return knex.schema.createTable("followers", tbl => {
    tbl.unique(["username", "account_id"]);
    tbl.increments();
    tbl.string("instagram_id");
    tbl.string("username");
    tbl.string("full_name");
    tbl.string("profile_pic_url");
    tbl.boolean("is_private");
    tbl.boolean("is_verified");
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
  return knex.schema.dropTableIfExists("followers");
};
