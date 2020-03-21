const crypto = require("crypto");

const secretkey = "mamamialezatos";

module.exports = text => {
  return crypto
    .createHmac("sha256", secretkey)
    .update(text)
    .digest("hex");
};
