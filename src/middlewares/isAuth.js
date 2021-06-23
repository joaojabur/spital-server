const { verify } = require("jsonwebtoken");
const authConfig = require("../configs/authConfig.json");

module.exports = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    res.status(401).send({ error: "Token não enviado" });
  }

  try {
    verify(token, authConfig.secret, (err, decoded) => {
      if (err) {
        res.status(401).send({ error: "Erro na verificação do token" });
      }

      res.locals.post = decoded.id;
    });
  } catch (error) {
    res.status(401).send({ error });
  }

  return next();
};
