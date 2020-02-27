const router = require("express").Router();
const { productController } = require("../controllers");

router.get("/get_products/:storeid", productController.getProducts);
router.get("/get_images/:productid", productController.getImages);
router.post("/add", productController.postProduct);

module.exports = router;
