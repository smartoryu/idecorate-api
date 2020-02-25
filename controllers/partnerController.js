const { mysqldb } = require("../database");

module.exports = {
  getStore: (req, res) => {
    const { userid } = req.query;

    try {
      let sql = `SELECT * FROM stores WHERE userid = ${userid}`;
      mysqldb.query(sql, (err, resStore) => {
        if (err) res.status(500).send(err);

        return res.status(200).send({ result: resStore[0] });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "There's an error on the server. Please contact the administrator." });
    }
  }
};
