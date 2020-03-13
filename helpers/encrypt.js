const crypto = require("crypto");

module.exports = text => {
  return crypto
    .createHmac("sha256", "mamamialezatos")
    .update(text)
    .digest("hex");
};
