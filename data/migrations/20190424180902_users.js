exports.up = function(knex, Promise) {
  return knex.schema.createTable("users", tbl => {
    tbl.increments();
    tbl.string("name");
    tbl.string("email");
    tbl.string("image_url");
    tbl.string("nickname");
    tbl.string("sub");
    tbl.string("inst_username");
    tbl
      .integer("account_id")
      .references("id")
      .inTable("accounts")
      .nullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("users");
};
