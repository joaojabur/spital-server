const { verify } = require("jsonwebtoken");
const authConfig = require("../configs/authConfig.json");

const validateTokens = (req, res, next) => {
  const accessToken = req.cookie("access-token");

  if (!accessToken)
    return res.status(401).send({ error: "Usuário não autenticado" });

  try {
    const validToken = verify(accessToken, authConfig.secret);
    if (validToken) {
      req.authenticated = true;
      return next();
    }
  } catch (error) {
    next(error);
  }
};

module.exports = validateTokens;
