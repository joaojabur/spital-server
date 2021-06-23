const knex = require("../database");
const paymentConfirmation = require("../services/email/paymentConfirmation");
const refundConfirmation = require("../services/email/refundConfirmation");
const moip = require("moip-sdk-node").default({
  accessToken: "7bd5812b36bd4cc89f69311f8badc7e9_v2",
  production: false,
});

module.exports = {
  async index(req, res, next) {
    try {
      const { medicID, date, scheduleID } = req.query;

      let query = knex("schedules");

      if (scheduleID) {
        query = knex("appointments")
          .where({ scheduleID })
          .join("schedules", "schedules.id", "=", "appointments.scheduleID")
          .join("medics", "medics.id", "=", "schedules.medicID")
          .join("users", "users.id", "=", "medics.userID")
          .select([
            "appointments.*",
            "schedules.medicID",
            "medics.*",
            "users.*",
          ]);
      }
      if (!scheduleID) {
        if (medicID !== undefined && date !== undefined) {
          query
            .where({ medicID: medicID, date: date })
            .join(
              "appointments",
              "schedules.id",
              "=",
              "appointments.scheduleID"
            )
            .join("medics", "medics.id", "=", "schedules.medicID")
            .select(["appointments.*", "schedules.medicID", "medics.*"]);
        } else if (medicID !== undefined) {
          query
            .where({ medicID: medicID })
            .join(
              "appointments",
              "schedules.id",
              "=",
              "appointments.scheduleID"
            )
            .join("medics", "medics.id", "=", "schedules.medicID")
            .join("clients", "clients.id", "=", "appointments.clientID")
            .join("users", "users.id", "=", "clients.userID")
            .select([
              "appointments.id",
              "appointments.type",
              "appointments.date",
              "appointments.time",
              "appointments.price",
              "appointments.confirmed",
              "users.first_name",
              "users.last_name",
            ])
            .orderByRaw("id DESC");
        } else {
          query
            .join(
              "appointments",
              "schedules.id",
              "=",
              "appointments.scheduleID"
            )
            .join("medics", "medics.id", "=", "schedules.medicID")
            .join("clients", "clients.id", "=", "appointments.clientID")

            .select(["appointments.*", "schedules.medicID", "clients.*"]);
        }
      }

      const results = await query;

      res.status(201).send(results);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { clientID, medicID } = req.query;
      const { appointmentData } = req.body;

      const [customerMoipID] = await knex("clients")
        .where({ id: clientID })
        .select("accountID");

      const [medicMoipID] = await knex("medics")
        .where({ id: medicID })
        .select("*");

      const request = await moip.order.create({
        ownId: clientID,
        amount: {
          currency: "BRL",
          subtotals: {
            shipping: 0,
          },
        },
        items: [
          {
            product: appointmentData.type,
            quantity: 1,
            detail: `Consulta médica ${appointmentData.date} - ${appointmentData.time}`,
            price: Number(appointmentData.price) * 100,
          },
        ],

        receivers: [
          {
            type: "SECONDARY",
            feePayor: false,
            moipAccount: {
              id: medicMoipID.moipAccountID,
            },
            amount: {
              percentual: 90,
            },
          },
        ],

        customer: {
          id: customerMoipID.accountID,
        },
      });

      res.status(201).json({
        message: "Pedido enviado com sucesso! 🎉",
        success: true,
        orderID: request.body.id,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { date, time } = req.body;
      await knex("appointments")
        .update({
          date,
          time,
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
      const { userID } = req.query;

      const [appointment] = await knex("appointments")
        .where({ paymentID: id })
        .join("schedules", "schedules.id", "=", "appointments.scheduleID")
        .select("appointments.*", "schedules.medicID");

      await moip.payment.refunds.create(id);

      const [medic] = await knex("medics")
        .where("medics.id", "=", appointment.medicID)
        .join("users", "users.id", "=", "medics.userID")
        .select("users.*", "medics.*");
      const [client] = await knex("clients")
        .where("clients.id", "=", appointment.clientID)
        .join("users", "users.id", "=", "clients.userID")
        .select("users.*", "clients.*");

      await knex("appointments").where({ paymentID: id }).del();

      let [location] = await knex("addresses").where("userID", medic.userID);
      console.log(location);

      refundConfirmation({
        name: `${client.first_name} ${client.last_name}`,
        email: client.email,
        medic,
        appointment,
        location: location,
      });

      res.status(201).json({
        message: "Reembolso realizado com sucesso!",
        success: true,
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    const { clientID } = req.params;

    const query = knex("appointments");

    if (clientID) {
      query
        .where({ clientID })
        .join("schedules", "schedules.id", "=", "appointments.scheduleID")
        .join("medics", "medics.id", "=", "schedules.medicID")
        .join("users", "users.id", "=", "medics.userID")
        .select(["appointments.*", "schedules.medicID", "medics.*", "users.*"])
        .orderBy([{ column: "appointments.created_at", order: "desc" }]);
    }

    const results = await query;
    res.status(200).send(results);

    try {
    } catch (error) {
      next(error);
    }
  },

  async pay(req, res, next) {
    try {
      const { orderID } = req.params;
      const { medicID, clientID, userID } = req.query;
      const { date, hash, appointmentData, cpf, time } = req.body;

      const [client] = await knex("clients")
        .where("clients.id", "=", clientID)
        .join("users", "users.id", "=", "clients.userID")
        .select("users.*", "clients.*");

      const [ddd, phone] = client.phoneNumber.split(")");
      const formattedDDD = ddd.replace("(", "");
      const formattedPhoneNumber = phone.replace(/[- ]/g, "");

      const payment = await moip.payment.create(orderID, {
        installmentCount: 1,
        statementDescriptor: "spital.com.br",
        fundingInstrument: {
          method: "CREDIT_CARD",
          creditCard: {
            hash: hash,
            holder: {
              fullname: `${client.first_name} ${client.last_name}`,
              birthdate: client.birth_date,
              taxDocument: {
                type: "CPF",
                number: cpf,
              },
              phone: {
                countryCode: "55",
                areaCode: formattedDDD,
                number: formattedPhoneNumber,
              },
            },
          },
        },
      });

      const scheduleID = await knex("schedules").returning("id").insert({
        medicID,
      });

      await knex("appointments").insert({
        clientID: parseInt(clientID),
        scheduleID: parseInt(scheduleID),
        date,
        time: time,
        price: parseInt(appointmentData.price),
        paymentID: payment.body.id,
        type: appointmentData.type,
        orderID: orderID,
      });

      const [medic] = await knex("medics")
        .where("medics.id", "=", medicID)
        .join("users", "users.id", "=", "medics.userID")
        .select("users.*", "medics.*");

      let [location] = await knex("addresses").where("userID", userID);

      if (medic && client) {
        await paymentConfirmation({
          name: `${client.first_name} ${client.last_name}`,
          email: client.email,
          medic: medic,
          appointment: appointmentData,
          time: time,
          location: location,
        });
      }

      res.status(201).json({
        success: true,
        message: "Pagamento concluído!",
        id: payment.body.id,
      });
    } catch (error) {
      next(error);
    }
  },
};
