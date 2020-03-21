const fs = require("fs");
const { mysqldb } = require("../database");
const { uploader } = require("../helpers/uploader");
const createJWTToken = require("../helpers/jwt");
const moment = require("moment");

module.exports = {
  createStore: (req, res) => {
    const userid = parseInt(req.user.userid);

    let sql = `INSERT INTO stores SET ?`;
    mysqldb.query(sql, { userid }, (err, resStoreId) => {
      if (err) return res.status(500).send(err);

      let newStoreId = resStoreId.insertId;

      const Path = `/store/${newStoreId}/photos`;
      const upload = uploader(Path, `PROFILE-${newStoreId}`).fields([{ name: "photo" }]);
      upload(req, res, err => {
        if (err) res.status(500).send(err);

        let imagePath = req.files.photo ? Path + "/" + req.files.photo[0].filename : null;
        let data = JSON.parse(req.body.data);
        data.iat = moment().format("YYYY-MM-DD HH:mm:ss");
        if (imagePath) data.photo = imagePath;

        let sql = `UPDATE stores SET ? WHERE storeid = ${newStoreId}`;
        mysqldb.query(sql, data, (err, resUpdate) => {
          if (err) {
            if (imagePath) fs.unlinkSync("./public" + imagePath);
            res.status(500).send(err);
          }

          let sql = `SELECT storeid, storename, storelink, phone, email, photo, address, city, province FROM stores WHERE storeid = ${newStoreId}`;
          mysqldb.query(sql, (err, resStore) => {
            if (err) res.status(500).send(err);

            let sql = `SELECT u.id, r.role FROM users u LEFT JOIN roles r ON u.roleid = r.id WHERE u.id = ${userid}`;
            mysqldb.query(sql, (err, resUser) => {
              if (err) res.status(500).send(err);

              let tokenItem = { userid: resUser[0].id, role: resUser[0].role, storeid: newStoreId };
              const token = createJWTToken(tokenItem);

              return res.status(200).send({ result: resStore[0], token });
            });
          });
        });
      });
    });
  },
  getStore: (req, res) => {
    const { userid } = req.user;
    console.log("54", userid);
    if (userid > 0) {
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
  },
  updateStore: (req, res) => {
    const { storeid } = req.params;

    // SELECT STORE DATA FROM DATABASE
    let sql = `SELECT * FROM stores WHERE storeid = ${storeid}`;
    mysqldb.query(sql, (err, resStore) => {
      if (err) res.status(500).json({ message: "Upload picture failed!", error: err.message });

      // UPLOAD THE INSERTED PHOTO TO THE PATH FOLDER
      const Path = `/store/${storeid}/photos`;
      const upload = uploader(Path, `PROFILE-${storeid}`).fields([{ name: "photo" }]);

      try {
        upload(req, res, errUpload => {
          if (errUpload) res.status(500).json({ message: "Upload poster failed!", error: errUpload.message });

          // SAVE THE FULL PATH TO IMAGEPATH
          let { photo } = req.files;
          let imagePath = photo ? Path + "/" + photo[0].filename : null;

          // SAVE BODY.DATA FROM FRONTEND TO DATA
          let data = JSON.parse(req.body.data);

          // UPDATE LAST UPLOAD AND NEW IMAGEPATH (IF THERE'S ANY!)
          data.lastupdated = moment().format("YYYY-MM-DD HH:mm:ss");
          if (imagePath) data.photo = imagePath;

          // SEND THE UPDATE DATA TO DATABASE
          let sql = `UPDATE stores SET ? WHERE storeid = ${storeid}`;
          mysqldb.query(sql, data, (err, resUpdate) => {
            if (err) {
              // IF ERROR, DELETE THE LAST NEW UPLOADED PHOTO
              if (imagePath) fs.unlinkSync("./public" + imagePath);
              return res.status(500).send(err);
            }

            if (imagePath) {
              // IF SUCCESS, DELETE THE OLD PHOTO FROM DATABASE
              if (resStore[0].photo) fs.unlinkSync("./public" + resStore[0].photo);
            }

            console.log(imagePath);

            // GET NEW UPDATED DATA STORE
            let sql = `SELECT
            storeid, storename, storelink, phone, email, photo, address, city, province
            FROM stores WHERE storeid = ${storeid}`;
            mysqldb.query(sql, (err, result) => {
              if (err) res.status(500).send(err);

              // IF SUCCESS, SEND THE RESULT TO FRONTEND
              return res.status(200).send({ result });
            });
          });

          // END OF TRY
        });
      } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "There's an error on the server. Please contact the administrator." });
      }

      // END OF UPDATE CONTROLLER
    });
  }
};
