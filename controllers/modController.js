const { mysqldb } = require("../database");
const moment = require("moment");
const { getAllOrderList, getAllOrderItems, getAllConfirmedOrderList } = require("../helpers/query");

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

          let sql = getAllConfirmedOrderList(userid);
          mysqldb.query(sql, (err, resConfirmedOrder) => {
            if (err) return res.status(500).send(err);

            return res.status(200).send({
              orders: resOrders,
              orderItems: resOrderItems,
              confirmedOrders: resConfirmedOrder
            });
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

          let sql = getAllConfirmedOrderList(userid);
          mysqldb.query(sql, (err, resConfirmedOrder) => {
            if (err) return res.status(500).send(err);

            return res.status(200).send({
              orders: resOrders,
              orderItems: resOrderItems,
              confirmedOrders: resConfirmedOrder
            });
          });
        });
      });
    });
  },
  pickOrderToProccess: (req, res) => {
    const { userid } = req.user;
    const { id } = req.params;

    let sql = `SELECT moderator FROM transactions WHERE id = ${id}`;
    mysqldb.query(sql, (err, result) => {
      if (err) return res.status(500).send(err);

      if (result[0].moderator) {
        let sql = getAllOrderList(userid);
        mysqldb.query(sql, (err, resOrders) => {
          if (err) return res.status(500).send(err);

          let sql = getAllOrderItems(userid);
          mysqldb.query(sql, (err, resOrderItems) => {
            if (err) return res.status(500).send(err);

            let sql = getAllConfirmedOrderList(userid);
            mysqldb.query(sql, (err, resConfirmedOrder) => {
              if (err) return res.status(500).send(err);

              return res.status(200).send({
                status: false,
                orders: resOrders,
                orderItems: resOrderItems,
                confirmedOrders: resConfirmedOrder
              });
            });
          });
        });
      } else {
        let sql = `UPDATE transactions SET ? where id = ${id}`;
        mysqldb.query(sql, { moderator: userid }, (err, resUpdate) => {
          if (err) return res.status(500).send(err);

          let sql = getAllOrderList(userid);
          mysqldb.query(sql, (err, resOrders) => {
            if (err) return res.status(500).send(err);

            let sql = getAllOrderItems(userid);
            mysqldb.query(sql, (err, resOrderItems) => {
              if (err) return res.status(500).send(err);

              let sql = getAllConfirmedOrderList(userid);
              mysqldb.query(sql, (err, resConfirmedOrder) => {
                if (err) return res.status(500).send(err);

                return res.status(200).send({
                  status: true,
                  orders: resOrders,
                  orderItems: resOrderItems,
                  confirmedOrders: resConfirmedOrder
                });
              });
            });
          });
        });
      }
    });
  }
};
