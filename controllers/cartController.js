const { mysqldb } = require("../database");
const moment = require("moment");
const { getProductDetails, getCartDetails } = require("../helpers/query");

module.exports = {
  getCart: (req, res) => {
    const { userid } = req.user;

    let sql = getCartDetails(userid);
    mysqldb.query(sql, (err, resCart) => {
      if (err) return res.status(500).send(err);

      return res.status(200).send({ result: resCart });
    });
  },
  postToCart: (req, res) => {
    const { userid } = req.user;
    const { productid, qty } = req.body;

    let newTransdetails = {
      userid,
      productid,
      qty,
      position: "cart",
      iat: moment().format("YYYY-MM-DD HH:mm:ss")
    };

    let sql = `INSERT INTO transaction_details SET ?`;
    mysqldb.query(sql, newTransdetails, (err, resInsert) => {
      if (err) return res.status(500).send(err);

      let sql = `SELECT sold_qty FROM products WHERE id = ${productid}`;
      mysqldb.query(sql, (err, resSoldQty) => {
        if (err) return res.status(500).send(err);

        let updateqty = { sold_qty: resSoldQty[0].sold_qty + qty };

        let sql = `UPDATE products SET ? WHERE id = ${productid}`;
        mysqldb.query(sql, updateqty, (err, resUpdate) => {
          if (err) return res.status(500).send(err);

          let sql = getCartDetails(userid);
          mysqldb.query(sql, (err, resCart) => {
            if (err) return res.status(500).send(err);

            let sql = getProductDetails(productid);
            mysqldb.query(sql, (err, resDetails) => {
              if (err) return res.status(500).send(err);

              return res.status(200).send({ result: resCart, details: resDetails[0] });
            });
          });
        });
      });
    });
  },
  putCart: (req, res) => {
    const { userid } = req.user;
    const { transdetailsid } = req.params;
    const { qty } = req.body;
    const putData = { qty };

    // GET OLD QTY FROM TRANSDETAIL
    let sql = `SELECT productid, qty FROM transaction_details WHERE transdetailsid = ${transdetailsid}`;
    mysqldb.query(sql, (err, resProduct) => {
      if (err) return res.status(500).send(err);

      // GET OLD SOLD_QTY FROM PRODUCT
      let sql = `SELECT sold_qty FROM products WHERE id = ${resProduct[0].productid}`;
      mysqldb.query(sql, (err, resSoldQty) => {
        if (err) return res.status(500).send(err);

        // UPDATE TRANSDETAIL WITH NEW QTY
        let sql = `UPDATE transaction_details SET ? WHERE transdetailsid = ${transdetailsid}`;
        mysqldb.query(sql, putData, (err, resPut) => {
          if (err) return res.status(500).send(err);

          // UPDATE SOLD_QTY PRODUCT BY DEDUCTING OLD SOLD_SQTY BY OLD QTY THEN ADD WITH NEW QTY
          let updateqty = { sold_qty: resSoldQty[0].sold_qty - resProduct[0].qty + qty };
          let sql = `UPDATE products SET ? WHERE id = ${resProduct[0].productid}`;
          mysqldb.query(sql, updateqty, (err, resUpdate) => {
            if (err) return res.status(500).send(err);

            let sql = getCartDetails(userid);
            mysqldb.query(sql, (err, resCart) => {
              if (err) return res.status(500).send(err);

              return res.status(200).send({ result: resCart });
            });
          });
        });
      });
    });
  },
  deleteFromCart: (req, res) => {
    const { userid } = req.user;
    const { transdetailsid } = req.params;

    let sql = `SELECT productid, qty FROM transaction_details WHERE transdetailsid = ${transdetailsid}`;
    mysqldb.query(sql, (err, resProduct) => {
      if (err) return res.status(500).send(err);

      let sql = `SELECT sold_qty FROM products WHERE id = ${resProduct[0].productid}`;
      mysqldb.query(sql, (err, resSoldQty) => {
        if (err) return res.status(500).send(err);

        let updateqty = { sold_qty: resSoldQty[0].sold_qty - resProduct[0].qty };

        let sql = `UPDATE products SET ? WHERE id = ${resProduct[0].productid}`;
        mysqldb.query(sql, updateqty, (err, resUpdate) => {
          if (err) return res.status(500).send(err);

          let sql = `DELETE FROM transaction_details WHERE transdetailsid = ${transdetailsid}`;
          mysqldb.query(sql, (err, resDelete) => {
            if (err) return res.status(500).send(err);

            let sql = getCartDetails(userid);
            mysqldb.query(sql, (err, resCart) => {
              if (err) return res.status(500).send(err);

              return res.status(200).send({ result: resCart });
            });
          });
        });
      });
    });
  }
};
