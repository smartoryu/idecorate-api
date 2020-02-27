/* eslint-disable no-unused-vars */
const moment = require("moment");
const { mysqldb } = require("../database");
const encrypt = require("../helpers/encrypt");
const createJWTToken = require("../helpers/jwt");
const transporter = require("./../helpers/mailer");
const { LOGIN_SUCCESS, REG_SUCCESS, WRONG_USER, WRONG_PASS, WRONG_FORM } = require("../helpers/types");

module.exports = {
  hashpassword: (req, res) => {
    let hashpassword = encrypt(req.query.password);
    return res.send(hashpassword);
  },
  checkUsername: (req, res) => {
    let { username } = req.query;

    let sql = `SELECT * FROM users WHERE username='${username}'`;
    mysqldb.query(sql, (err, uname) => {
      if (err) res.status(500).send(err);

      if (uname[0]) {
        return res.status(200).send({ status: "WRONG_USER", message: "Username not available" });
      } else {
        return res.status(200).send({ status: "GOOD_USER" });
      }
    });
  },
  login: (req, res) => {
    let { id } = req.params;
    let { username, password } = req.query;

    if (username || password) {
      let sql = `SELECT id FROM users WHERE username='${username}'`;
      mysqldb.query(sql, (err, uname) => {
        if (err) res.status(500).send(err);
        console.log("username", username);

        // === IF USERNAME NOT REGISTERED
        if (!uname[0]) {
          return res.status(200).send({ status: WRONG_USER, message: "Username not found!" });
        }

        sql = `SELECT id FROM users WHERE username='${username}' AND suspend='true'`;
        mysqldb.query(sql, (err, suspend) => {
          if (err) res.status(500).send(err);
          // console.log("suspend", suspend);

          // === IF USERNAME SUSPENDED
          if (suspend[0]) {
            return res.status(200).send({ status: "SUSPENDED", message: "Your account is suspended!" });
          }

          password = encrypt(password);
          sql = `SELECT u.*, r.role FROM users u LEFT JOIN roles r ON u.roleid = r.id WHERE username='${username}' AND password='${password}'`;
          mysqldb.query(sql, (err, user) => {
            if (err) res.status(500).send(err);

            // console.log(user);

            // === IF PASSWORD WRONG
            if (user[0] === undefined) {
              return res.status(200).send({ status: WRONG_PASS, message: "Password incorrect!" });

              // === ALL SEEMS GOOD!
            } else {
              // === UPDATE LASTLOGIN
              let lastlogin = moment().format("YYYY-MM-DD HH:mm:ss");
              sql = `UPDATE users SET ? WHERE id=${user[0].id}`;
              mysqldb.query(sql, { lastlogin }, (err, lastlogin) => {
                if (err) res.status(500).send(err);

                // === GET NEWEST USERDATA
                sql = `SELECT
                u.id, u.name, u.username, r.role, u.suspend, u.verified,
                s.storeid, s.storename, s.storelink, s.phone, s.email, s.photo, s.address, s.city, s.province
                FROM users u 
                LEFT JOIN roles r ON u.roleid = r.id 
                LEFT JOIN stores s ON u.id = s.userid 
                WHERE u.id=${user[0].id}`;
                mysqldb.query(sql, (err, resLogin) => {
                  if (err) res.status(500).send(err);

                  const token = createJWTToken({ id: resLogin[0].id, role: resLogin[0].roleid });
                  let { id, name, username, email, role } = resLogin[0];
                  return res.status(200).send({
                    token,
                    status: LOGIN_SUCCESS,
                    result: resLogin[0]
                  });
                });
              });
            }
          });
        });
      });
    } else if (id) {
      let sql = `SELECT u.*, r.role FROM users u LEFT JOIN roles r ON u.roleid = r.id WHERE u.id = ${id}`;
      mysqldb.query(sql, (err, login) => {
        if (err) res.status(500).send(err);

        // === KEEP SESSION LOGIN
        const token = createJWTToken({ id: login[0].id, role: login[0].roleid });
        let { id, name, username, email, role } = login[0];
        return res.status(200).send({
          token,
          status: LOGIN_SUCCESS,
          result: { id, name, username, email, role }
        });
      });
    } else {
      return res.status(200).send({ status: WRONG_FORM, message: "All input must be filled!" });
    }
  },
  register: (req, res) => {
    let { name, username, email, password, password2 } = req.body;

    console.log(req.body);

    let sql = `SELECT * FROM users WHERE username='${username}'`;
    mysqldb.query(sql, (err, resUsername) => {
      if (err) res.status(500).send(err);

      // === ALL INPUT MUST BE FILLED
      if (!name || !username || !email || !password || !password2) {
        return res.status(200).send({ status: WRONG_FORM, message: "All input must be filled!" });
      }

      // === IF USERNAME ALREADY REGISTERED
      else if (resUsername[0]) {
        return res.status(200).send({ status: WRONG_USER, message: "Username not available" });
      }

      // === IF PASSWORD DOESN'T MATCH
      else if (password !== password2) {
        return res.status(200).send({ status: WRONG_PASS, message: "Password doesn't match!" });
      }

      // === IF EVERYTHING ARE GOOD TO GO
      else {
        let newUser = {
          name,
          username,
          email,
          password: encrypt(password2),
          roleid: 1,
          lastlogin: moment().format("YYYY-MM-DD HH:mm:ss")
        };
        sql = `INSERT INTO users set ?`;
        mysqldb.query(sql, newUser, (err, resNewUser) => {
          if (err) res.status(200).send(err);
          console.log("registered");

          // let verifyLink = "kepo";
          // let mailOptions = {
          //   from: "admin <prikenang.tech@gmail.com>",
          //   to: email,
          //   subject: "Verify your account!",
          //   html: `Please verify your account by clicking on this <a href=${verifyLink}>link</a>`
          // };
          // transporter.sendMail(mailOptions, (err, resMail) => {
          //   if (err) res.status(500).send(err);
          //   return res.status(200).send({ status: "REG_SUCCESS" });
          // });

          return res.status(200).send({ status: REG_SUCCESS });
        });
      }
    });
  }
};
