const verifyToken = require('../middlewares/verifyToken');
const recoverEmail = require("../services/email/recover");
const notifyRecoverEmail = require("../services/email/notifyRecover");
const knex = require("../database");
const bcrypt = require("bcrypt");

module.exports = {
  async index(req, res, next) {
    try {
      const { id } = req.query;

      if (!id) {
        const results = await knex("users");

        return res.status(200).json(results);
      } else {
        const [result] = await knex("users").where({ id });

        return res.status(200).json({
          email: result.email,
          firstName: result.first_name,
          lastName: result.last_name,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await knex("users").where({ id }).del();

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },

  async emailVerification(req, res, next) {
    try {
      const userID = verifyToken(req.params.token);

      await knex("users")
        .where({
          id: userID,
        })
        .update({
          confirmed: true,
        });

      res.send(200);
    } catch (err) {
      next(err);
    }
  },

  async forgetPassword(req, res, next) {
    const { email } = req.body;
    try {
      let [ user ] = await knex('users').where({ email });

      if (user){
        let name = `${user.first_name} ${user.last_name}`;
        
        await recoverEmail({
          email,
          name,
          id: user.id
        });

        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    } catch(err){
      res.sendStatus(404);
    }
  },

  async recoverPassword(req, res, next) {
    const userID = verifyToken(req.params.token);

    if (userID){
      const { password } = req.body;
      try {
        const hashPassword = await bcrypt.hash(password, 10);

        await knex('users')
          .where({ id: userID})
          .update({
            password: hashPassword
          });

        let [ user ] = await knex('users').where({ id: userID});

        await notifyRecoverEmail({
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
        });

        res.sendStatus(200);
      } catch (err){
        res.sendStatus(500).json({ err: err.message});
      }
    } else {
      res.sendStatus(404).json({ err: "Página não encontrada"});
    }
  },

  async verifyRecoverToken(req, res, next) {
    const userID = verifyToken(req.params.token);
    
    if (userID){
      res.sendStatus(202);
    } else {
      res.sendStatus(404);
    }
  }
};
