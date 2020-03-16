const fs = require("fs");
const moment = require("moment");
const { mysqldb } = require("../database");
const { uploader } = require("../helpers/uploader");

const sqlGetAllProduct = storeid => {
  return `SELECT p.id as productid, p.storeid, p.name, p.stock, t.type, p.price, p.about, p.cover_image
    FROM products p LEFT JOIN product_types t
    ON p.typeid = t.id WHERE storeid = ${storeid}`;
};

module.exports = {
  getProducts: (req, res) => {
    const { storeid } = req.user;

    /**
     * ================================================== GET PRODUCTS
     * if storeid present as params, get all products from the same store
     */
    let sql = sqlGetAllProduct(storeid);
    mysqldb.query(sql, (err, resProduct) => {
      if (err) res.status(500).send(err);

      return res.status(200).send({ result: resProduct });
    });
  },
  getTypes: (req, res) => {
    let sql = `SELECT * FROM product_types`;
    mysqldb.query(sql, (err, result) => {
      if (err) res.status(500).send(err);

      return res.status(200).send({ result });
    });
  },
  getImages: (req, res) => {
    const { productid } = req.params;

    /**
     * ================================================== GET PRODUCT IMAGES
     * if productid present as params, get all images from the same product
     */
    if (productid) {
      let sql = `SELECT id as imageid, productid, image FROM product_images WHERE productid = ${productid}`;
      mysqldb.query(sql, (err, resImages) => {
        if (err) res.status(500).send(err);

        resImages && res.status(200).send({ result: resImages });
      });
    }
  },
  putProduct: (req, res) => {
    const { storeid } = req.user;
    const { productid } = req.params;
    const Path = `/products/${storeid}/images`;

    // upload the inserted images to the path folder
    const upload = uploader(Path, `PRODUCT-${storeid}`).fields([{ name: "image" }]);
    upload(req, res, err => {
      if (err) res.status(500).json({ message: "Upload picture failed!", error: err.message });

      // access image(s) sent from front-end
      const { image } = req.files;

      // save the imagepath and original filename to array
      let imagePath = [];
      if (image) {
        image.forEach(image => imagePath.push(Path + "/" + image.filename));
      }

      // merge images' upload path with the last inserted ID Product in new array
      let arrImages = [];
      imagePath.forEach(image => arrImages.push([productid, image]));

      // access data sent from front-end
      const data = JSON.parse(req.body.data);
      // added update time to data product
      data.updatetime = moment().format("YYYY-MM-DD HH:mm:ss");

      // insert images' path to database
      if (arrImages[0]) {
        let sql = `INSERT INTO product_images (productid, image) VALUES ?`;
        mysqldb.query(sql, [arrImages], (err, resAddImage) => {
          if (err) {
            try {
              arrImages.forEach(({ image }) => fs.unlinkSync("./public" + image));
            } catch {
              console.log("file not found");
            }
            return res.status(500).json({ message: "Upload images failed!", error: err.message });
          }
        });
      }

      // if INSERT success, get all of the product with the same storeid
      let sql = `SELECT id as imageid, productid, image FROM product_images WHERE productid = ${productid}`;
      mysqldb.query(sql, (err, resImages) => {
        if (err) res.status(500).send(err);

        // added first uploaded image as default cover_image
        data.cover_image = resImages[0].image;

        let sql = `UPDATE products SET ? WHERE id = ${productid}`;
        mysqldb.query(sql, data, (err, resUpdateData) => {
          if (err) res.status(500).send(err);

          // GET ALL DATA
          let sql = sqlGetAllProduct(storeid);
          mysqldb.query(sql, (err, resProducts) => {
            if (err) res.status(500).send(err);

            // send fetched data and redirect to frontend
            return res.status(200).send({ images: resImages, products: resProducts });
          });
        });
      });
    });
  },
  postProduct: (req, res) => {
    const { storeid } = req.user;
    const Path = `/products/${storeid}/images`;

    // upload the inserted images to the path folder
    const upload = uploader(Path, `PRODUCT-${storeid}`).fields([{ name: "image" }]);
    upload(req, res, err => {
      if (err) res.status(500).json({ message: "Upload picture failed!", error: err.message });

      // access image(s) sent from front-end
      const { image } = req.files;
      let imagePath = [];
      let imageFilename = [];

      // save the imagepath and original filename to array
      if (image) {
        image.forEach(image => {
          imagePath.push(Path + "/" + image.filename);
          imageFilename.push(image.originalname);
        });
      }

      // access data sent from front-end
      const data = JSON.parse(req.body.data);

      // add storeid to the product
      data.storeid = parseInt(storeid);
      // convert price value to integer
      data.price = parseInt(data.price);
      // added issued time to data product
      data.iat = moment().format("YYYY-MM-DD HH:mm:ss");
      // added update time to data product
      data.updatetime = moment().format("YYYY-MM-DD HH:mm:ss");
      // added first uploaded image as default cover_image
      data.cover_image = imagePath[0];

      try {
        // insert data product to database
        let sql = "INSERT INTO products SET ?";
        mysqldb.query(sql, data, (err, resProduct) => {
          if (err) res.status(500).json({ message: "Upload data products failed!", error: err.message });

          // merge images' upload path with the last inserted ID Product in new array
          let arrImages = [];
          imagePath.forEach(image => {
            arrImages.push([resProduct.insertId, image]);
          });

          // insert images' path to database
          let sql = `INSERT INTO product_images (productid, image) VALUES ?`;
          mysqldb.query(sql, [arrImages], (err, resImage) => {
            if (err) res.status(500).json({ message: "Upload images failed!", error: err.message });

            // if INSERT success, get all of the product with the same storeid
            let sql = sqlGetAllProduct(storeid);
            mysqldb.query(sql, (err, resProducts) => {
              if (err) res.status(500).send(err);

              // send fetched data and redirect to frontend
              res.status(200).send({ result: resProducts, redirect: true });
            });
          });
        });
      } catch (err) {
        image && imagePath.forEach(image => fs.unlinkSync("./public" + image));
        console.log(err);
        return res.status(500).json({ message: "There's an error on the server. Please contact the administrator." });
      }
    });
  },
  deleteProductImage: (req, res) => {
    const { imageid } = req.params;

    let sql = `SELECT productid, image FROM product_images WHERE id = ${imageid}`;
    mysqldb.query(sql, (err, resImage) => {
      if (err) res.status(500).send(err);

      if (resImage[0]) {
        try {
          fs.unlinkSync(`./public${resImage[0].image}`);
        } catch (error) {
          console.log("file not found/already deleted");
        }
      }
      let productid = resImage[0].productid;

      let sql = `DELETE FROM product_images WHERE id = ${imageid}`;
      mysqldb.query(sql, (err, resDelete) => {
        if (err) res.status(500).send(err);
        console.log(resImage[0].image, " deleted, productid", productid);

        let sql = `SELECT id as imageid, productid, image FROM product_images WHERE productid = ${productid}`;
        mysqldb.query(sql, (err, resImages) => {
          if (err) res.status(500).send(err);

          let data = { cover_image: resImages[0].image };
          let sql = `UPDATE products SET ? WHERE id = ${productid}`;
          mysqldb.query(sql, data, (err, resUpdateData) => {
            if (err) res.status(500).send(err);

            return res.status(200).send({ result: resImages });
          });
        });
      });
    });
  },
  deleteProduct: (req, res) => {
    const { productid } = req.params;
    const { storeid } = req.user;

    // GET THE IMAGE PATH FROM DATABASE WITH STORED PRODUCTID
    let sql = `SELECT image FROM product_images WHERE productid = ${productid}`;
    mysqldb.query(sql, (err, resImages) => {
      if (err) res.status(500).send(err);

      // IF THERE'S ANY IMAGE(S), UNLINK/DELETE THE FOLDER+FILE WITH THE EXACT PATH
      try {
        resImages[0] && resImages.forEach(({ image }) => fs.unlinkSync(`./public${image}`));
      } catch {
        console.log("file not found!");
      }

      // AND THEN, DELETE THE PRODUCT. IT WOULD DELETE THE PRODUCT'S DATA & IMAGES
      let sql = `DELETE FROM products WHERE id = ${productid}`;
      mysqldb.query(sql, (err, resDelete) => {
        if (err) res.status(500).send(err);

        resImages[0] && resImages.forEach(({ image }) => console.log(image, " deleted"));

        // LAST, SELECT ALL THE REMAINING PRODUCT WITH STORED STOREID
        let sql = sqlGetAllProduct(storeid);
        mysqldb.query(sql, (err, resProducts) => {
          if (err) res.status(500).send(err);

          return res.status(200).send({ status: "success", result: resProducts });
        });
      });
    });
  }
};
