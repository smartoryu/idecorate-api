const fs = require("fs");
const moment = require("moment");
const { mysqldb } = require("../database");
const { uploader } = require("../helpers/uploader");

module.exports = {
  getProducts: (req, res) => {
    const { storeid } = req.params;

    /**
     * ================================================== GET PRODUCTS
     * if storeid present as params, get all products from the same store
     */
    if (storeid > 0) {
      let sql = `SELECT id as productid, name, price, type, about FROM products WHERE storeid = ${storeid}`;
      mysqldb.query(sql, (err, resProduct) => {
        if (err) res.status(500).send(err);

        return res.status(200).send({ result: resProduct });
        //
      });
    }
  },
  getImages: (req, res) => {
    const { productid } = req.params;

    /**
     * ================================================== GET PRODUCT IMAGES
     * if productid present as params, get all images from the same product
     */
    if (productid) {
      let sql = `SELECT id as imageid, image FROM product_images WHERE productid = ${productid}`;
      mysqldb.query(sql, (err, resImages) => {
        if (err) res.status(500).send(err);

        // console.log("images", resImages);
        resImages && res.status(200).send({ result: resImages });
      });
    }
  },
  postProduct: (req, res) => {
    const Path = "/products/images";
    const { storeid } = req.params;

    // upload the inserted images to the path folder
    const upload = uploader(Path, "PRODUCT").fields([{ name: "image" }]);
    upload(req, res, err => {
      if (err) res.status(500).json({ message: "Upload picture failed!", error: err.message });

      // access image(s) sent from front-end
      const { image } = req.files;
      let imagePath = [];
      let imageFilename = [];

      // save the imagepath and original filename to array
      if (image) {
        image.forEach((val, idx) => {
          imagePath.push(Path + "/" + val.filename);
          imageFilename.push(val.originalname);
        });
      }

      // access data sent from front-end
      const data = JSON.parse(req.body.data);

      // convert price value to integer
      data.price = parseInt(data.price);
      // added upload time to data product
      data.uploadtime = moment().format("YYYY-MM-DD HH:mm:ss");
      data.storeid = storeid;

      try {
        // insert data product to database
        let sql = "INSERT INTO products SET ?";
        mysqldb.query(sql, data, (err, resProduct) => {
          if (err) res.status(500).json({ message: "Upload data products failed!", error: err.message });

          // merge images' upload path with the last inserted ID Product in new array
          let arrImages = [];
          imagePath.forEach((val, idx) => {
            arrImages.push([resProduct.insertId, val]);
          });

          // insert images' path to database
          let sql = `INSERT INTO product_images (productid, image) VALUES ?`;
          mysqldb.query(sql, [arrImages], (err, resImage) => {
            if (err) res.status(500).json({ message: "Upload images failed!", error: err.message });

            // if INSERT success, get all of the product with the same storeid
            let sql = `SELECT id as productid, name, price, stock, type, about FROM products WHERE storeid = ${storeid}`;
            mysqldb.query(sql, (err, resProducts) => {
              if (err) res.status(500).send(err);

              // send fetched data and redirect to frontend
              res.status(200).send({ result: resProducts, redirect: true });
            });
          });
        });
      } catch (err) {
        image && imagePath.forEach((val, id) => fs.unlinkSync("./public" + val));
        console.log(err);
        return res.status(500).json({ message: "There's an error on the server. Please contact the administrator." });
      }
    });
  },
  putProduct: (req, res) => {
    //
  },
  deleteProduct: (req, res) => {
    const { productid, storeid } = req.params;

    // GET THE IMAGE PATH FROM DATABASE WITH STORED PRODUCTID
    let sql = `SELECT image FROM product_images WHERE productid = ${productid}`;
    mysqldb.query(sql, (err, resImages) => {
      if (err) res.status(500).send(err);

      // IF THERE'S ANY IMAGE(S), UNLINK/DELETE THE FOLDER+FILE WITH THE EXACT PATH
      resImages[0] && resImages.forEach(({ image }) => fs.unlinkSync(`./public${image}`));

      // AND THEN, DELETE THE PRODUCT. IT WOULD DELETE THE PRODUCT'S DATA & IMAGES
      let sql = `DELETE FROM products WHERE id = ${productid}`;
      mysqldb.query(sql, (err, resDelete) => {
        if (err) res.status(500).send(err);

        // LAST, SELECT ALL THE REMAINING PRODUCT WITH STORED STOREID
        let sql = `SELECT id as productid, name, price, type, about FROM products WHERE storeid = ${storeid}`;
        mysqldb.query(sql, (err, resProducts) => {
          if (err) res.status(500).send(err);

          return res.status(200).send({ result: resProducts });
        });
      });
    });
  }
};
