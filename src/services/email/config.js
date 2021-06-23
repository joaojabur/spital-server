const nodemailer = require("nodemailer");
require("dotenv").config({ path: "./src/.env" });

let transproter = nodemailer.createTransport({
  service: process.env.NODEMAILER_SERVICE,
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS,
  },
});

module.exports = transproter;
