const knex = require("../database");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/authConfig.json");
const bcrypt = require("bcrypt");
const verifyEmail = require("../services/email/verify");
const moip = require("moip-sdk-node").default({
  token: "U3UJDDW9WKUUUYN4SY5URVIPFMFSBFX1",
  key: "B0HZCGHREPSALKIP6RUKWRYJS3Z2X0IDJYXJWMIJ",
  production: false,
});

module.exports = {
  async index(req, res, next) {
    try {
      const { id } = req.query;

      if (!id) {
        const results = await knex("clients");

        return res.status(200).json(results);
      } else {
        let query = knex("clients");

        query
          .where({
            userID: id,
          })
          .join("users", "users.id", "=", "clients.userID")
          .select("users.*", "clients.*");

        const [result] = await query;

        if (!result) {
          res.status(404).send({ success: false });
        }

        return res.status(200).json({
          email: result.email,
          firstName: result.first_name,
          lastName: result.last_name,
          xp: result.xp,
          phoneNumber: result.phoneNumber,
          id: result.id,
          accountID: result.accountID,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const plat_id =
      letters.charAt(Math.floor(Math.random() * letters.length)) +
      (Math.random() + 1).toString(36).substr(2, 9);
    try {
      const { firstName, lastName, email, password, phoneNumber, birthDate } =
        req.body;

      const hashPassword = await bcrypt.hash(password, 10);

      const isTheEmailAlreadyRegistered = await knex("users").where({
        email,
      });

      if (isTheEmailAlreadyRegistered.length > 0) {
        res.json({ message: "E-mail já registrado", success: false });
      } else {
        const [userID] = await knex("users").returning("id").insert({
          first_name: firstName,
          last_name: lastName,
          email,
          password: hashPassword,
          birth_date: birthDate,
          xp: 32,
        });

        await knex("clients").insert({
          phoneNumber: String(phoneNumber),
          userID: parseInt(userID),
        });

        moip.customer
          .create({
            ownId: plat_id,
            fullname: `${firstName} ${lastName}`,
            email: email,
            birthDate: birthDate,
          })
          .then(async (response) => {
            await knex("clients")
              .where({ userID })
              .update({ accountID: response.body.id });
          });

        await verifyEmail({
          id: userID,
          email,
          name: `${firstName} ${lastName}`,
        });

        return res.status(201).send();
      }
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    const { fullName, phoneNumber } = req.body;
    const { id } = req.params;

    const [first_name, last_name] = fullName.split(" ");

    try {
      await knex("users")
        .update({
          first_name,
          last_name,
        })
        .where({ id });

      await knex("clients")
        .update({
          phoneNumber,
        })
        .where({ userID: id });

      return res.status(200).send();
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { userID } = req.params;

      await knex("clients").where({ userID }).del();

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const [user] = await knex("users")
        .where({ email })
        .select("password", "id", "confirmed");

      if (user === undefined) {
        return res.status(401).send({ error: "Usuário não encontrado" });
      }

      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id }, authConfig.secret, {
          expiresIn: 604800,
        });

        res.cookie(
          "access-token",
          token,
          {
            maxAge: 60 * 60 * 24 * 7 * 1000,
          },
          {
            httpOnly: true,
          }
        );

        res.status(201).send({
          id: user.id,
          confirmed: user.confirmed,
          token,
        });
      } else {
        return res.status(401).send({ error: "Senha ou e-mail inválido(s)" });
      }
    } catch (error) {
      next(error);
    }
  },

  async auth(req, res, next) {
    const { post } = res.locals;

    let [{ confirmed }] = await knex("users")
      .where({
        id: parseInt(post),
      })
      .select("confirmed");

    res.status(200).send({
      auth: true,
      success: "Logado com sucesso!",
      userID: post,
      confirmed,
    });
  },
};
