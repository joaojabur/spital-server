exports.up = function (knex) {
  return knex.schema.createTable("schedules", (table) => {
    table.increments("id");

    table.integer("medicID").references("medics.id").notNullable().onDelete("CASCADE");

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("schedules");
};
