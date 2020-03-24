/* eslint-disable no-unused-vars */
const moment = require("moment");
const { mysqldb } = require("../database");
const encrypt = require("../helpers/encrypt");
const createJWTToken = require("../helpers/jwt");
const transporter = require("./../helpers/mailer");
const {
  LOGIN_SUCCESS,
  REG_SUCCESS,
  SUSPENDED,
  GOOD_USER,
  WRONG_USER,
  WRONG_PASS,
  WRONG_FORM,
  UNVERIFIED,
  CREATE_NEW_STORE
} = require("../helpers/types");

const getDataUser = userid => {
  return `SELECT u.id, u.name, u.username, u.email, r.role, a.label, a.receiver, a.phone, a.city, a.zip_code, a.address, u.suspend, u.verified, u.lastlogin
  FROM users u
  LEFT JOIN roles r ON u.roleid = r.id
  LEFT JOIN user_address a ON u.id = a.userid
  WHERE u.id = ${userid}`;
};

const getCartDetails = userid => {
  return `SELECT td.transdetailsid, td.userid, p.storeid, td.productid, p.name, p.price, td.qty, p.cover_image AS image, td.position
FROM transaction_details td LEFT JOIN products p ON td.productid = p.id
WHERE td.userid = ${userid} AND position = 'cart'`;
};

const getAllProduct = storeid => {
  return `SELECT p.id as productid, p.storeid, p.name, p.stock, t.type, p.price, p.about, p.cover_image
    FROM products p LEFT JOIN product_types t
    ON p.typeid = t.id WHERE storeid = ${storeid} ORDER BY p.id DESC`;
};

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

      if (uname.length) {
        return res.status(200).send({ status: WRONG_USER, message: "Username not available" });
      } else {
        return res.status(200).send({ status: GOOD_USER });
      }
    });
  },
  login: (req, res) => {
    let { username, password } = req.query;
    let token;

    if (username || password) {
      let sql = `SELECT id FROM users WHERE username='${username}'`;
      mysqldb.query(sql, (err, uname) => {
        if (err) return res.status(500).send(err);

        // === IF USERNAME NOT REGISTERED
        if (!uname[0]) return res.status(200).send({ status: WRONG_USER, message: "Username not found!" });

        let sql = `SELECT id FROM users WHERE username='${username}' AND suspend='true'`;
        mysqldb.query(sql, (err, suspend) => {
          if (err) return res.status(500).send(err);

          // === IF USERNAME SUSPENDED
          if (suspend[0]) return res.status(200).send({ status: SUSPENDED, message: "Your account is suspended!" });

          password = encrypt(password);
          let sql = `SELECT id FROM users WHERE username='${username}' AND password='${password}'`;
          mysqldb.query(sql, (err, user) => {
            if (err) return res.status(500).send(err);

            // === IF PASSWORD WRONG
            if (!user[0]) {
              return res.status(200).send({ status: WRONG_PASS, message: "Password incorrect!" });
              // === ALL SEEMS GOOD!
            } else {
              let lastlogin = moment().format("YYYY-MM-DD HH:mm:ss");
              sql = `UPDATE users SET ? WHERE id=${user[0].id}`;
              mysqldb.query(sql, { lastlogin }, (err, resLastlogin) => {
                if (err) return res.status(500).send(err);

                let sql = `SELECT verified FROM users WHERE id=${user[0].id}`;
                mysqldb.query(sql, (err, resVerify) => {
                  if (err) return res.status(500).send(err);

                  if (resVerify[0].verified !== "true") {
                    return res.status(200).send({ status: UNVERIFIED });
                  } else {
                    // === GET NEWEST USERDATA
                    let sql = getDataUser(user[0].id);
                    mysqldb.query(sql, (err, resLogin) => {
                      if (err) res.status(500).send(err);

                      console.log(resLogin[0].role);

                      switch (resLogin[0].role) {
                        case "admin":
                          token = createJWTToken({
                            userid: resLogin[0].id,
                            role: resLogin[0].role
                          });

                          return res.status(200).send({
                            token,
                            status: LOGIN_SUCCESS,
                            result: resLogin[0]
                          });

                        // END OF ADMIN SECTION
                        case "member":
                          sql = getCartDetails(user[0].id);
                          return mysqldb.query(sql, (err, resCart) => {
                            if (err) return res.status(500).send(err);

                            token = createJWTToken({
                              userid: resLogin[0].id,
                              role: resLogin[0].role
                            });

                            return res.status(200).send({
                              token,
                              status: LOGIN_SUCCESS,
                              result: resLogin[0],
                              cart: resCart
                            });
                          });

                        // END OF MEMBER SECTION
                        case "partner":
                          sql = `SELECT * FROM stores WHERE userid=${user[0].id}`;
                          return mysqldb.query(sql, (err, resStore) => {
                            if (err) res.status(500).send(err);

                            if (!resStore.length) {
                              token = createJWTToken({
                                userid: resLogin[0].id,
                                role: resLogin[0].role
                              });

                              return res.status(200).send({
                                token,
                                status: "LOGIN_NEW_PARTNER",
                                result: resLogin[0]
                              });

                              // END OF NEW PARTNER SECTION
                            } else {
                              token = createJWTToken({
                                userid: resLogin[0].id,
                                role: resLogin[0].role,
                                storeid: resStore[0].storeid
                              });

                              return res.status(200).send({
                                token,
                                status: "LOGIN_PARTNER",
                                result: resLogin[0],
                                store: resStore[0]
                              });

                              // END OF PARTNER WITH STORE SECTION
                            }
                          });

                        // END OF PARTNER SECTION
                        default:
                          console.log("unknown error");
                          break;
                      }
                    });
                  }
                });
              });
            }
          });
        });
      });

      // END OF LOGIN CONTROLLER
    } else {
      return res.status(200).send({ status: WRONG_FORM, message: "All input must be filled!" });
    }
  },
  keeplogin: (req, res) => {
    let { userid } = req.user;
    let token;

    let sql = getDataUser(userid);
    mysqldb.query(sql, (err, resLogin) => {
      if (err) return res.status(500).send(err);

      switch (resLogin[0].role) {
        case "admin":
          token = createJWTToken({
            userid: resLogin[0].id,
            role: resLogin[0].role
          });

          return res.status(200).send({
            token,
            status: LOGIN_SUCCESS,
            result: resLogin[0]
          });

        // END OF ADMIN SECTION
        case "member":
          sql = getCartDetails(userid);
          return mysqldb.query(sql, (err, resCart) => {
            if (err) return res.status(500).send(err);

            token = createJWTToken({
              userid: resLogin[0].id,
              role: resLogin[0].role
            });

            return res.status(200).send({
              token,
              status: LOGIN_SUCCESS,
              result: resLogin[0],
              cart: resCart
            });
          });

        // END OF MEMBER SECTION
        case "partner":
          sql = `SELECT * FROM stores WHERE userid=${userid}`;
          return mysqldb.query(sql, (err, resStore) => {
            if (err) res.status(500).send(err);

            if (!resStore.length) {
              token = createJWTToken({
                userid: resLogin[0].id,
                role: resLogin[0].role
              });

              return res.status(200).send({
                token,
                status: CREATE_NEW_STORE,
                result: resLogin[0]
              });
              // END OF NEW PARTNER SECTION
            } else {
              token = createJWTToken({
                userid: resLogin[0].id,
                role: resLogin[0].role,
                storeid: resStore[0].storeid
              });

              return res.status(200).send({
                token,
                status: "LOGIN_PARTNER",
                result: resLogin[0],
                store: resStore[0]
              });

              // END OF PARTNER WITH STORE SECTION
            }
          });

        default:
          console.log("unknown error");
          break;
      }
    });

    // END OF KEEP-LOGIN CONTROLLER
  },
  register: (req, res) => {
    let { name, username, email, password, password2 } = req.body;

    let sql = `SELECT * FROM users WHERE username='${username}'`;
    mysqldb.query(sql, (err, resUsername) => {
      if (err) res.status(500).send(err);

      // === ALL INPUT MUST BE FILLED ===
      if (!name || !username || !email || !password || !password2) {
        return res.status(200).send({ status: WRONG_FORM, message: "All input must be filled!" });
      }

      // === IF USERNAME ALREADY REGISTERED ===
      else if (resUsername.length) {
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
          roleid: 3,
          suspend: "false",
          verified: `${encrypt(email)}${encrypt(password)}_${username}_${encrypt(username)}`,
          iat: moment().format("YYYY-MM-DD HH:mm:ss")
        };
        sql = `INSERT INTO users set ?`;
        mysqldb.query(sql, newUser, (err, resNewUser) => {
          if (err) res.status(200).send(err);
          console.log("registered");

          let sql = `SELECT verified FROM users WHERE id = ${resNewUser.insertId}`;
          mysqldb.query(sql, (err, verify) => {
            if (err) res.status(500).send(err);

            let verifyLink = `http://localhost:3000/verification/${verify[0].verified}`;
            let mailOptions = {
              from: "admin <prikenang.tech@gmail.com>",
              to: email,
              subject: "Verify iDecorate's Account",
              html: `Please verify your account by clicking on this <a href=${verifyLink}>link</a>`
            };
            transporter.sendMail(mailOptions, (err, resMail) => {
              if (err) res.status(500).send(err);
              return res.status(200).send({ status: "REG_SUCCESS" });
            });
          });

          return res.status(200).send({ status: REG_SUCCESS });
        });
      }
    });
  },
  verifyAccount: (req, res) => {
    const { token } = req.query;
    let username = token.split("_")[1];

    let sql = `SELECT id, verified FROM users WHERE username='${username}'`;
    mysqldb.query(sql, (err, resUser) => {
      if (err) return res.status(500).send(err);

      if (!resUser.length) {
        return res.status(200).send({ status: "VERIFY_WRONG", message: "Your confirmation link already expired." });
      } else if (token !== resUser[0].verified) {
        return res.status(200).send({ status: "VERIFY_FAILED" });
      }

      let update = { verified: "true", lastlogin: moment().format("YYYY-MM-DD HH:mm:ss") };

      let sql = `UPDATE users SET ? WHERE id = ${resUser[0].id}`;
      mysqldb.query(sql, update, (err, resVerify) => {
        if (err) return res.status(500).send(err);

        let sql = `SELECT u.id, u.name, u.username, u.email, r.role, u.suspend, u.verified, u.lastlogin
        FROM users u LEFT JOIN roles r ON u.roleid = r.id
        WHERE u.id = ${resUser[0].id}`;
        mysqldb.query(sql, (err, resLogin) => {
          if (err) return res.status(500).send(err);

          let tokenItem = { userid: resLogin[0].id, role: resLogin[0].role };
          const token = createJWTToken(tokenItem);
          return res.status(200).send({
            token,
            status: LOGIN_SUCCESS,
            result: resLogin[0],
            message: "Your account is verified."
          });
        });
      });
    });
  }
};
