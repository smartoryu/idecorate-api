const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "idecorate",
  password: "bahagia",
  database: "idecorate",
  port: 3306
});

module.exports = db;
