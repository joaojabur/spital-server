exports.up = function (knex) {
  return knex.schema.createTable("medic_schedule", (table) => {
    table.increments("id");

    table.string("from").notNullable();
    table.string("to").notNullable();
    table.integer("week_day").notNullable();

    table
      .integer("scheduleID")
      .references("schedules.id")
      .notNullable()
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  knex.schema.dropTable("medic_schedule");
};
