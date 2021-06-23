exports.up = function (knex) {
  return knex.schema.createTable("appointments", (table) => {
    table.increments("id");

    table.string("type");
    table.string("date").notNullable();
    table.string("time").notNullable();
    table.string("price").notNullable();
    table.string("orderID").notNullable();
    table.string("paymentID").notNullable();
    table.boolean("confirmed").defaultTo(false);
    table.boolean("rated").defaultTo(false);

    table
      .integer("clientID")
      .references("clients.id")
      .notNullable()
      .onDelete("CASCADE");

    table
      .integer("scheduleID")
      .references("schedules.id")
      .notNullable()
      .onDelete("CASCADE");

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("appointments");
};
