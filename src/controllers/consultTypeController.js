const knex = require("../database");

module.exports = {
  async index(req, res, next) {
    try {
      const { medicID } = req.query;

      const query = knex("consult_type");

      if (medicID) {
        query.where({ medicID });
      }

      const results = await query;

      res.status(201).send(results);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { type, price, description } = req.body;
      const { medicID } = req.query;

      await knex("consult_type").insert({
        type,
        price,
        description,
        medicID,
      });

      res.status(201).send();
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { type, price } = req.body;

      await knex("consult_type")
        .update({
          type,
          price,
        })
        .where({ id });

      res.status(200).send({ message: "Consulta atualizada com sucesso!" });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await knex("consult_type").where({ id }).del();

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },

  async getSpecificType(req, res, next) {
    try {
      const { id } = req.params;

      const [result] = await knex("consult_type").where({ id }).select("*");

      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  },
};
