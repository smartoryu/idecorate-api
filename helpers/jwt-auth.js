const jwt = require("jsonwebtoken");
const fs = require("fs");

module.exports = {
  auth: (req, res, next) => {
    /**
     * NOTE!
     * - CHANGE THE publicKEY with your string secret code
     *   but, make sure it's the same as your privateKEY in jwt.js
     */
    if (req.method !== "OPTIONS") {
      let publicKEY = fs.readFileSync("./public.key", "utf8");
      jwt.verify(req.token, publicKEY, { expiresIn: "6h", algorithm: ["RS256"] }, (error, decoded) => {
        // jwt.verify(req.token, "mamamia", { expiresIn: "6h" }, (error, decoded) => {
        if (error) return res.status(401).send({ message: "User not authorized.", name: "User not authorized." });

        req.user = decoded;
        next();
      });
    } else {
      next();
    }
  }
};
