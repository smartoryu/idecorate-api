const router = require("express").Router();
const { productController } = require("../controllers");

router.get("/get_products/:storeid", productController.getProducts);
router.get("/get_images/:productid", productController.getImages);

router.post("/add/:storeid", productController.postProduct);

router.delete("/delete/:storeid/:productid", productController.deleteProduct);

module.exports = router;
