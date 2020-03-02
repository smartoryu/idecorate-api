const router = require("express").Router();
const { productController } = require("../controllers");
const { auth } = require("../helpers/jwt-auth");

router.get("/get_products/:storeid", auth, productController.getProducts);
router.get("/get_images/:productid", auth, productController.getImages);

router.post("/add/:storeid", auth, productController.postProduct);

router.delete("/delete/:storeid/:productid", auth, productController.deleteProduct);

module.exports = router;
