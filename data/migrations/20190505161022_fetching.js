exports.up = function(knex, Promise) {
  return knex.schema.createTable("fetching", tbl => {
    tbl.increments();
    tbl.boolean("fetching").defaultTo(false);
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
  return knex.schema.dropTableIfExists("fetching");
};
