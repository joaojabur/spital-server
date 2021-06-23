exports.up = function (knex) {
  return knex.schema.createTable("addresses", (table) => {
    table.increments("id");
    table.string("address")
    table.integer("number");
    table.decimal("lat")
    table.decimal("lon")
    
    table
      .integer("userID")
      .references("users.id")
      .notNullable()
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("addresses");
};
