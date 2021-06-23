exports.up = function (knex) {
  return knex.schema.createTable("reviews", (table) => {
    table.increments("id");

    table.text("description");
    table.integer("stars").notNullable();
    table
      .integer("medicID")
      .references("medics.id")
      .notNullable()
      .onDelete("CASCADE");

    table
      .integer("clientID")
      .references("clients.id")
      .notNullable()
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("reviews");
};
