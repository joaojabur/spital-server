const knex = require("../database");
const jwt = require("jsonwebtoken");
const authConfig = require("../configs/authConfig.json");
const convertHourToMinutes = require("../utils/convertHoursToMinutes");
const bcrypt = require("bcrypt");
const verify = require("../services/email/verify");

module.exports = {
  async index(req, res, next) {
    try {
      let { id, offset, lat, lon } = req.query;

      if (!offset) {
        offset = 1;
      }

      if (lat === undefined || lon === undefined) {
        lat = -23.6821604;
        lon = -46.8754915;
      }

      if (!id) {
        let results = await knex.select(
          knex.raw(`
            users.*, medic.*, addresses."userID", addresses.number, address, 
            (((acos(sin((${lat} *pi()/180)) * sin((lat * pi()/180)) 
            + cos((${lat}*pi()/180)) * cos((lat*pi()/180))
            * cos(((${lon} - lon) * pi()/180))))
              * 180/pi()) * 60 * 1.1515 * 1.609344) 
              as distance
          FROM addresses
          join medics as medic
          on medic."userID" = addresses."userID"
          join users
          on medic."userID" = users.id
          Order by distance
          desc
          OFFSET ${offset * 30}
          LIMIT 30
        `)
        );

        let formatedResults = [];

        for (let result of results) {
          if (!result) {
            return res.status(404).send();
          }

          let [{ star }] = await knex.select(
            knex.raw(`
              round(avg(stars), 2) as star from reviews where reviews."medicID" = ${result.id};`)
          );

          formatedResults.push({
            ...result,
            password: undefined,
            firstName: result.first_name,
            first_name: undefined,
            lastName: result.last_name,
            last_name: undefined,
            rating: star ? star : "4.0",
          });
        }

        res.status(201).json(formatedResults);
      } else {
        let [result] = await knex("medics")
          .where("userID", id)
          .join("users", "users.id", "=", "medics.userID")
          .select(
            "medics.*",
            "users.first_name",
            "users.last_name",
            "users.confirmed",
            "users.email",
            "users.xp"
          );

        if (!result) {
          return res.status(404).send({ success: false });
        }

        let [{ star }] = await knex.select(
          knex.raw(`
            round(avg(stars), 2) as star from reviews where reviews."medicID" = ${result.id};`)
        );

        let [location] = await knex("addresses").where("userID", id);

        result.rating = star;

        result = {
          ...result,
          password: undefined,
          rg: undefined,
          cpf: undefined,
          firstName: result.first_name,
          first_name: undefined,
          lastName: result.last_name,
          last_name: undefined,
          rating: star ? star : "4.0",
          location,
        };

        return res.status(200).json(result);
      }
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      area,
      graduation,
      master_degree,
      doctorate_degree,
      crm,
      cpf,
      rg,
      birthDate,
      schedule,
    } = req.body;

    const hashPassword = await bcrypt.hash(password, 10);

    try {
      const isTheEmailAlreadyRegistered = await knex("users").where({
        email,
      });

      const isTheCPFOrRGAlreadyRegistered = await knex("medics").where({
        cpf,
        rg,
      });

      if (isTheEmailAlreadyRegistered.length > 0) {
        res.json({ success: false, message: "E-mail já registrado" });
      } else if (isTheCPFOrRGAlreadyRegistered.length > 0) {
        res.json({ success: false, message: "CPF e RG já registrados" });
      } else {
        const userID = await knex("users").returning("id").insert({
          first_name: firstName,
          last_name: lastName,
          email,
          password: hashPassword,
          birth_date: birthDate,
          xp: 0,
        });

        const medicID = await knex("medics")
          .returning("id")
          .insert({
            userID: parseInt(userID),
            phoneNumber: String(phoneNumber),
            area,
            graduation,
            master_degree,
            doctorate_degree,
            crm,
            cpf,
            rg,
          });

        const scheduleID = await knex("schedules")
          .returning("id")
          .insert({ medicID: parseInt(medicID) });

        for (let sche of schedule) {
          console.log(sche.from, convertHourToMinutes(sche.from));
          await knex("medic_schedule").insert({
            scheduleID: parseInt(scheduleID),
            week_day: sche.week_day,
            from: convertHourToMinutes(sche.from),
            to: convertHourToMinutes(sche.to),
          });
        }

        await verify({
          id: parseInt(userID),
          email,
          name: firstName + " " + lastName,
        });

        res.status(201).json({
          success: true,
          message: "Cadastro realizado com sucesso!",
        });
      }
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    const {
      first_name,
      last_name,
      email,
      password,
      phoneNumber,
      created_at,
      area,
      graduation,
      master_degree,
      doctorate_degree,
      crm,
      cpf,
      rg,
      birth_date,
    } = req.body;

    const { userID } = req.params;

    try {
      await knex("medics")
        .update({
          first_name,
          last_name,
          email,
          password,
          phoneNumber,
          created_at,
          area,
          graduation,
          master_degree,
          doctorate_degree,
          cpf,
          crm,
          rg,
          birth_date,
        })
        .where({ userID });

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    const { userID } = req.params;

    try {
      await knex("medics").where({ userID }).del();

      res.status(201).send();
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    let { area } = req.params;
    let { offset, lat, lon, distance, name } = req.query;
    const formattedArea = area.replace(/[-]/g, " ");

    if (!name) {
      name = "";
    }
    if (!offset) {
      offset = 0;
    }

    if (!distance || distance === "null") {
      distance = 999999;
    }

    try {
      let results = await knex.select(
        knex.raw(`
        *
        from (
          select 
            addresses."userID",
            addresses.number,
            address,
            (((acos(sin((${lat} *pi()/180)) * sin((lat * pi()/180)) 
          + cos((${lat}*pi()/180)) * cos((lat*pi()/180))
          * cos(((${lon} - lon) * pi()/180))))
            * 180/pi()) * 60 * 1.1515 * 1.609344) 
            as distance from addresses
        ) address
        join medics as medic
        on medic."userID" = address."userID"
        join users as "user"
        on medic."userID" = "user".id
        where distance <= ${distance} and area = '${formattedArea}'
        and lower(
          (
              REGEXP_REPLACE("user".first_name, '[^0-9a-zA-Z:,]+', '')
                   || ' ' ||
              REGEXP_REPLACE("user".last_name, '[^0-9a-zA-Z:,]+', '')
           )) ~ '${name}'
        order by distance
        desc
        limit 30
        offset ${30 * offset}
      `)
      );

      let formatedResults = [];

      for (let result of results) {
        let [{ star }] = await knex.select(
          knex.raw(`
            round(avg(stars), 2) as star from reviews where reviews."medicID" = ${result.id};`)
        );

        formatedResults.push({
          ...result,
          password: undefined,
          firstName: result.first_name,
          first_name: undefined,
          lastName: result.last_name,
          last_name: undefined,
          rating: star ? star : "4.0",
        });
      }

      res.status(200).send(formatedResults);
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

        let [medic] = await knex("medics").where("userID", user.id);

        if (!medic) {
          throw Error("Email não encontrado");
        }

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
