const knex = require("../database");

module.exports = {
  async index(req, res, next) {
    try {
      const { medicID } = req.query;

      const query = knex("reviews");

      if (medicID) {
        query
          .where({
            medicID,
          })
          .join("medics", "medics.id", "=", "reviews.medicID")
          .join("clients", "clients.id", "=", "reviews.clientID")
          .join("users", "users.id", "=", "clients.userID")
          .select("reviews.*", "medics.userID", "clients.*", "users.*");
      }

      const results = await query;

      res.status(201).json(results);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { stars, description } = req.body;
      const { medicID, clientID } = req.query;
      await knex("reviews").insert({
        stars,
        description,
        medicID,
        clientID,
      });

      await knex("appointments").where({ clientID }).update({ rated: true });

      res.status(201).json({
        message: "Avaliação inserida com sucesso!",
        success: true,
      });
    } catch (error) {
      res.status(401).json({
        message: "Erro ao inserir avaliação...",
        success: false,
      });
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { stars, description } = req.body;

      await knex("reviews")
        .update({
          stars,
          description,
        })
        .where({ id });

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await knex("reviews").where({ id }).del();

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },
};
