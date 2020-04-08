const fs = require("fs");
const { mysqldb } = require("../database");
const moment = require("moment");
const { uploader } = require("../helpers/uploader");
const { getCartDetails, getOrderList, getOrderItems } = require("../helpers/query");

module.exports = {
  getOrderList: (req, res) => {
    const { userid } = req.user;

    let sql = getOrderList(userid);
    mysqldb.query(sql, (err, resOrderList) => {
      if (err) return res.status(500).send(err);

      let sql = getOrderItems(userid);
      mysqldb.query(sql, (err, resOrderItems) => {
        if (err) return res.status(500).send(err);

        return res.status(200).send({ order: resOrderList, orderItems: resOrderItems });
      });
    });
  },
  postToOrder: (req, res) => {
    const { userid } = req.user;
    const randNumber = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 1000;
    const invoiceNumber = `INV/${userid}/${randNumber}`;

    let order = {
      invoice: invoiceNumber,
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

        let sql = getCartDetails(userid);
        mysqldb.query(sql, (err, resCart) => {
          if (err) return res.status(500).send(err);

          let sql = getOrderList(userid);
          mysqldb.query(sql, (err, resOrders) => {
            if (err) return res.status(500).send(err);

            let sql = getOrderItems(userid);
            mysqldb.query(sql, (err, resOrderItems) => {
              if (err) return res.status(500).send(err);

              return res.status(200).send({
                cart: resCart,
                orders: resOrders,
                orderItems: resOrderItems
              });
            });
          });
        });
      });
    });
  },
  postReceipt: (req, res) => {
    const { userid } = req.user;
    const { invoice, id } = req.params;
    const Path = `/receipt/${userid}`;

    const upload = uploader(Path, `receipt-${id + invoice}`).fields([{ name: "image" }]);
    try {
      upload(req, res, errUpload => {
        if (errUpload) res.status(500).send(errUpload);

        let imagePath = req.files.image ? Path + "/" + req.files.image[0].filename : null;

        let receiptData = {
          payment_receipt: imagePath,
          payment_status: "Paid",
          order_status: "Awaiting Confirmation",
          paid_time: moment().format("YYYY-MM-DD HH:mm:ss")
        };

        let sql = `UPDATE transactions SET ? WHERE id = ${id}`;
        mysqldb.query(sql, receiptData, (err, resUpdate) => {
          if (err) {
            fs.unlinkSync("./public" + imagePath);
            return res.status(500).send(err);
          }

          let sql = getOrderList(userid);
          mysqldb.query(sql, (err, resOrders) => {
            if (err) return res.status(500).send(err);

            let sql = getOrderItems(userid);
            mysqldb.query(sql, (err, resOrderItems) => {
              if (err) return res.status(500).send(err);

              return res.status(200).send({
                orders: resOrders,
                orderItems: resOrderItems
              });
            });
          });
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "There's an error on the server. Please contact the administrator." });
    }
  },
  deleteReceipt: (req, res) => {
    const { userid } = req.user;
    const { id } = req.params;

    let sql = `SELECT payment_receipt, payment_status AS status FROM transactions WHERE id = ${id}`;
    mysqldb.query(sql, (err, result) => {
      if (err) return res.status(500).send(err);

      if (result[0].status !== "Confirmed") {
        let imagePath = result[0].payment_receipt;
        let deleteReceipt = {
          payment_receipt: null,
          payment_status: "Unpaid",
          order_status: "Awaiting Payment",
          paid_time: null
        };

        let sql = `UPDATE transactions SET ? WHERE id = ${id}`;
        mysqldb.query(sql, deleteReceipt, (err, resUpdate) => {
          if (err) return res.status(500).send(err);

          fs.unlinkSync("./public" + imagePath);

          let sql = getOrderList(userid);
          mysqldb.query(sql, (err, resOrders) => {
            if (err) return res.status(500).send(err);

            let sql = getOrderItems(userid);
            mysqldb.query(sql, (err, resOrderItems) => {
              if (err) return res.status(500).send(err);

              return res.status(200).send({
                orders: resOrders,
                orderItems: resOrderItems
              });
            });
          });
        });
      } else {
        return res.status(200).send({ message: "Delete failed! Payment already confirmed." });
      }
    });
  }
};
