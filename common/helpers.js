const db = require("../data/dbConfig");

const get = tbl => db(tbl);

const findBy = (tbl, filter) =>
  db(tbl)
    .where(filter)
    .first();

const add = (tbl, item) => db(tbl).insert(item);
const update = (tbl, id, item) =>
  db(tbl)
    .where({ id })
    .update(item);

const updateAccount = (tbl, id, item) =>
  db(tbl)
    .where({ account_id: id })
    .update(item);

const getAccount = id =>
  db
    .select("acc.*", "ad.*")
    .from("accounts as acc")
    .join("account_details as ad", "acc.id", "ad.account_id")
    .where("acc.id", id);

module.exports = {
  get,
  add,
  findBy,
  update,
  updateAccount,
  getAccount
};
