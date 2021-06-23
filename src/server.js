const express = require("express");
var https = require("https");
var fs = require("fs");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const routes = require("./routes");

var privateKey = fs.readFileSync(__dirname + "/keys/spital.pem");
var certificate = fs.readFileSync(__dirname + "/keys/cert.pem");

var credentials = { key: privateKey, cert: certificate };

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);
app.use(cookieParser());

app.use((req, res, next) => {
  const error = new Error("Not Found");

  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({ error: error.message });
});

app.listen(3333, () => {
  console.log("Server is running door 3333!");
});
