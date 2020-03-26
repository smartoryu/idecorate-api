const { mysqldb } = require("../database");
const moment = require("moment");
const { getAllOrderList, getAllOrderItems } = require("../helpers/query");

module.exports = {
  putPaymentToConfirmed: (req, res) => {
    const { userid } = req.user;
    const { id } = req.params;

    let confirmedPayment = {
      moderator: userid,
      payment_status: "Confirmed",
      order_status: "Processed",
      confirmed_time: moment().format("YYYY-MM-DD HH:mm:ss")
    };

    let sql = `UPDATE transactions SET ? WHERE id = ${id}`;
    mysqldb.query(sql, confirmedPayment, (err, resUpdate) => {
      if (err) return res.status(500).send(err);

      let sql = getAllOrderList(userid);
      mysqldb.query(sql, (err, resOrders) => {
        if (err) return res.status(500).send(err);

        let sql = getAllOrderItems(userid);
        mysqldb.query(sql, (err, resOrderItems) => {
          if (err) return res.status(500).send(err);

          return res.status(200).send({
            orders: resOrders,
            orderItems: resOrderItems
          });
        });
      });
    });
  },
  putPaymentToPaid: (req, res) => {
    const { userid } = req.user;
    const { id } = req.params;

    let confirmedPayment = {
      moderator: null,
      payment_status: "Paid",
      order_status: "Awaiting Confirmation",
      confirmed_time: null
    };

    let sql = `UPDATE transactions SET ? WHERE id = ${id}`;
    mysqldb.query(sql, confirmedPayment, (err, resUpdate) => {
      if (err) return res.status(500).send(err);

      let sql = getAllOrderList(userid);
      mysqldb.query(sql, (err, resOrders) => {
        if (err) return res.status(500).send(err);

        let sql = getAllOrderItems(userid);
        mysqldb.query(sql, (err, resOrderItems) => {
          if (err) return res.status(500).send(err);

          return res.status(200).send({
            orders: resOrders,
            orderItems: resOrderItems
          });
        });
      });
    });
  }
};
