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
  },
  getTypes: (req, res) => {
    let sql = `SELECT id, type AS name FROM product_types`;
    mysqldb.query(sql, (err, result) => {
      if (err) res.status(500).send(err);

      return res.status(200).send({ result });
    });
  },
  getDetails: (req, res) => {
    const { productid } = req.params;

    let sql = `SELECT p.id AS productid, p.storeid, p.name, (p.stock - p.sold_qty) AS stock, t.type, p.price, p.about, p.cover_image
    FROM products p LEFT JOIN product_types t
    ON p.typeid = t.id WHERE p.id = ${productid}`;
    mysqldb.query(sql, (err, resDetails) => {
      if (err) return res.status(500).send(err);

      let sql = `SELECT id, image FROM product_images WHERE productid = ${productid}`;
      mysqldb.query(sql, (err, resImages) => {
        if (err) return res.status(500).send(err);

        return res.status(200).send({ result: resDetails[0], images: resImages });
      });
    });
  }
};
