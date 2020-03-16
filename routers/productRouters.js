const router = require("express").Router();
const { productController } = require("../controllers");
const { auth } = require("../helpers/jwt-auth");

router.get("/get_products", auth, productController.getProducts);
router.get("/get_types", auth, productController.getTypes);
router.get("/get_images/:productid", auth, productController.getImages);

router.post("/edit/:productid", auth, productController.putProduct);

router.post("/add/:storeid", auth, productController.postProduct);

router.delete("/delete/p/:productid", auth, productController.deleteProduct);
router.delete("/delete/i/:imageid", auth, productController.deleteProductImage);

module.exports = router;
