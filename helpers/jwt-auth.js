const jwt = require("jsonwebtoken");
const fs = require("fs");

module.exports = {
  auth: (req, res, next) => {
    /**
     * NOTE!
     * - CHANGE THE publicKEY with your string secret code
     *   but, make sure it's the same as your privateKEY in jwt.js
     */
    let publicKEY = fs.readFileSync("./public.key", "utf8");
    if (req.method !== "OPTIONS") {
      jwt.verify(req.token, publicKEY, { expiresIn: "6h", algorithm: "RS256" }, (error, decoded) => {
        if (error) {
          return res.status(401).json({ message: "User not authorized.", error: "User not authorized." });
        }

        req.user = decoded;
        next();
      });
    } else {
      next();
    }
  }
};
