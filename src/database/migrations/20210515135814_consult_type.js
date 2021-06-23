exports.up = function (knex) {
  return knex.schema.createTable("consult_type", (table) => {
    table.increments("id");

    table.string("type").notNullable();
    table.string("price").notNullable();
    table.string("description");
    table
      .integer("medicID")
      .references("medics.id")
      .notNullable()
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("consult_type");
};
