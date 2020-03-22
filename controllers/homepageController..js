/* eslint-disable no-unused-vars */
const { mysqldb } = require("../database");

module.exports = {
  getImageSlideshow: (req, res) => {
    let sql = `SELECT id AS productid, storeid, cover_image AS src FROM products ORDER BY RAND() LIMIT 4`;
    mysqldb.query(sql, (err, resImage) => {
      if (err) return res.status(500).send(err);

      return res.status(200).send({ result: resImage });
    });
  },
  getImageSlider: (req, res) => {
    let sql = `SELECT p.id AS productid, p.storeid, p.name, p.stock, t.type, p.price, p.about, p.cover_image AS src
    FROM products p LEFT JOIN product_types t ON p.typeid = t.id WHERE t.type = "bed" ORDER BY RAND() LIMIT 8`;
    mysqldb.query(sql, (err, resImage) => {
      if (err) return res.status(500).send(err);

      return res.status(200).send({ result: resImage });
    });
  }
};
