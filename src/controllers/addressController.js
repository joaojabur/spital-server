const knex = require("../database");
const NodeGeocoder = require("node-geocoder");

const options = {
  provider: "google",
  apiKey: "AIzaSyDanmMSOYTtyp-Lbu43BVKiSW5EP8FRS9Y",
  formatter: null,
};

const geocoder = NodeGeocoder(options);

module.exports = {
  async index(req, res, next) {
    try {
      const { userID } = req.query;

      const query = knex("addresses");

      if (userID) {
        query
          .where("userID", userID)
          .join("users", "users.id", "=", "addresses.userID")
          .select("addresses.*");
      }

      const [results] = await query;

      res.status(201).json(results);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { address, number, lat, lon } = req.body;
      const { userID } = req.query;

      await knex("addresses").insert({
        address,
        number,
        lat,
        lon,
        userID: userID,
      });

      res.status(201).send();
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    let lat;
    let lon;

    try {
      const { id } = req.params;
      const { address, number } = req.body;
      const [response] = await geocoder.geocode(address);
      lat = response.latitude;
      lon = response.longitude;
      console.log(lat, lon);

      await knex("addresses")
        .update({
          address,
          number,
          lat,
          lon,
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
      await knex("addresses").where({ id }).del();

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },
};
