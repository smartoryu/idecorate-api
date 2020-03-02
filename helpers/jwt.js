const jwt = require("jsonwebtoken");
const fs = require("fs");

module.exports = payload => {
  /**
   * NOTE!
   * - CHANGE THE privateKEY with your string secret code
   *   but, make sure it's the same as your publicKEY in jwt-auth.js
   */
  let privateKEY = fs.readFileSync("./private.key", "utf8");
  return jwt.sign(payload, privateKEY, { expiresIn: "6h", algorithm: "RS256" });
};
