exports.up = function (knex) {
  return knex.schema.createTable("medics", (table) => {
    table.increments("id");

    table.string("phoneNumber").notNullable();

    table.text("area").notNullable();
    table.text("graduation").notNullable();
    table.text("master_degree");
    table.text("doctorate_degree");
    table.text("crm").notNullable();

    table.text("cpf").notNullable();
    table.text("rg").notNullable();

    table.text("moipAccountID");
    table.text("bankAccountID");

    table.boolean("configured").defaultTo(false);

    table
      .integer("userID")
      .references("id")
      .inTable("users")
      .notNullable()
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("medics");
};
