const jwt = require("jsonwebtoken");
const authConfig = require("../configs/authConfig.json");

module.exports = (token) => {
    const { id }  = jwt.verify(token, authConfig.secret);
    
    return id;
}