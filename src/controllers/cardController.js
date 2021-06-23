const knex = require("../database");

module.exports = {
  async index(req, res, next) {
    try {
      const { userID } = req.query;

      res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  },
  async create(req, res, next) {
    const { userID } = req.query;

    try {
      res.status(201).send();
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    const { id } = req.params;
    try {
      await knex("cards").where({ id }).delete();

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },
};
