const jwt = require("jsonwebtoken");

module.exports = payload => {
  return jwt.sign(payload, "lalapola", { expiresIn: "12h" });
};
