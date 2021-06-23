const { sign } = require("jsonwebtoken");
const authConfig = require("../configs/authConfig.json");

module.exports = (id) => {
  const token = sign({ id }, authConfig.secret, {
    expiresIn: 15 * 60,
  });

  return token;
};
