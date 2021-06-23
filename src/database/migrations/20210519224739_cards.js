exports.up = function (knex) {
  return knex.schema.createTable("cards", (table) => {
    table.increments("id");

    table.string("cardID").notNullable();
    table
      .integer("userID")
      .references("users.id")
      .notNullable()
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  knex.schema.dropTable("cards");
};
