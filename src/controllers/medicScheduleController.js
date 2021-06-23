const knex = require("../database");
const convertHourToMinutes = require("../utils/convertHoursToMinutes");

module.exports = {
  async index(req, res, next) {
    try {
      const { medicID, week_day } = req.query;

      const query = knex("schedules");

      if (medicID !== undefined && week_day !== undefined) {
        query
          .where({ medicID: medicID, week_day: week_day })
          .join(
            "medic_schedule",
            "schedules.id",
            "=",
            "medic_schedule.scheduleID"
          )
          .select(["schedules.*", "medic_schedule.*"]);
      } else if (medicID !== undefined) {
        query
          .where({ medicID: medicID })
          .join(
            "medic_schedule",
            "schedules.id",
            "=",
            "medic_schedule.scheduleID"
          )
          .select(["schedules.*", "medic_schedule.*"]);
      }

      const results = await query;

      res.status(201).send(results);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { schedule } = req.body;

      const medicSchedule = schedule.map((scheduleItem) => {
        return {
          week_day: scheduleItem.week_day,
          from: convertHourToMinutes(scheduleItem.from),
          to: convertHourToMinutes(scheduleItem.to),
        };
      });

      await knex("medic_schedule").insert(medicSchedule);

      return res.status(201).send();
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    const { from, to } = req.body;
    const { id } = req.params;

    const formattedFrom = convertHourToMinutes(from);
    const formattedTo = convertHourToMinutes(to);
    
    try {
      await knex("medic_schedule")
        .update({
          from: formattedFrom,
          to: formattedTo,
        })
        .where({ id });

      return res.status(200).send();
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await knex("medic_schedule").where({ id }).del();

      res.status(200).send();
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const { medicID } = req.params;
      const query = knex("schedules");

      if (medicID) {
        query
          .where({ medicID })
          .join(
            "medic_schedule",
            "schedules.id",
            "=",
            "medic_schedule.scheduleID"
          )
          .select(["schedules.*", "medic_schedule.*"]);
      }

      const results = await query;

      res.status(200).send(results);
    } catch (error) {
      next(error);
    }
  },

  async getSpecificSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const query = knex("medic_schedule");

      if (id) {
        query.where({ id }).select("*");
      }

      const [results] = await query;

      res.status(200).send(results);
    } catch (error) {
      next(error);
    }
  },
};
