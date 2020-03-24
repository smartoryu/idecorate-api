const { mysqldb } = require("../database");
const moment = require("moment");

const getProductDetails = productid => {
  return `SELECT p.id AS productid, p.storeid, p.name, (p.stock - p.sold_qty) AS stock, t.type, p.price, p.about, p.cover_image
    FROM products p LEFT JOIN product_types t
    ON p.typeid = t.id WHERE p.id = ${productid}`;
};

const getCartDetails = userid => {
  return `SELECT td.transdetailsid, td.userid, p.storeid, td.productid, p.name, p.price, td.qty, p.cover_image AS image, td.position
FROM transaction_details td LEFT JOIN products p ON td.productid = p.id
WHERE td.userid = ${userid} AND position = 'Cart'`;
};

const getAllOrders = userid => {
  return `SELECT id as transid, userid, payment_receipt, payment_status, order_status FROM transactions WHERE userid = ${userid}`;
};

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

    let putData = {
      qty
    };

    let sql = `UPDATE transaction_details SET ? WHERE transdetailsid = ${transdetailsid}`;
    mysqldb.query(sql, putData, (err, resUpdate) => {
      if (err) return res.status(500).send(err);

      let sql = getCartDetails(userid);
      mysqldb.query(sql, (err, resCart) => {
        if (err) return res.status(500).send(err);

        return res.status(200).send({ result: resCart });
      });
    });
  },
  deleteFromCart: (req, res) => {
    const { userid } = req.user;
    const { transdetailsid } = req.params;

    let sql = `DELETE FROM transaction_details WHERE transdetailsid = ${transdetailsid}`;
    mysqldb.query(sql, (err, resDelete) => {
      if (err) return res.status(500).send(err);

      let sql = getCartDetails(userid);
      mysqldb.query(sql, (err, resCart) => {
        if (err) return res.status(500).send(err);

        return res.status(200).send({ result: resCart });
      });
    });
  },
  postToOrder: (req, res) => {
    const { userid } = req.user;

    let order = {
      userid,
      payment_status: "Unpaid",
      order_status: "Awaiting Payment",
      ordered_time: moment().format("YYYY-MM-DD HH:mm:ss")
    };

    let sql = `INSERT INTO transactions set ?`;
    mysqldb.query(sql, order, (err, newOrder) => {
      if (err) return res.status(500).send(err);

      let update = {
        transid: newOrder.insertId,
        position: "Order"
      };

      let sql = `UPDATE transaction_details SET ? WHERE userid = ${userid} AND position = 'Cart'`;
      mysqldb.query(sql, update, (err, resUpdate) => {
        if (err) return res.status(500).send(err);

        // GET CARTS AND ORDER SECTION
        let sql = getCartDetails(userid);
        mysqldb.query(sql, (err, resCart) => {
          if (err) return res.status(500).send(err);

          let sql = getAllOrders(userid);
          mysqldb.query(sql, (err, resOrders) => {
            if (err) return res.status(500).send(err);

            return res.status(200).send({ cart: resCart, orders: resOrders });
          });
        });
        // GET CARTS AND ORDER SECTION
      });
    });
  }
};
