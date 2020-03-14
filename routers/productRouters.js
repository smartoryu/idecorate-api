const router = require("express").Router();
const { productController } = require("../controllers");
const { auth } = require("../helpers/jwt-auth");

router.get("/get_products", auth, productController.getProducts);
router.get("/get_types", auth, productController.getTypes);
router.get("/get_images/:productid", auth, productController.getImages);

// router.put("/edit", auth, productController.putProduct);

router.post("/add/:storeid", auth, productController.postProduct);
router.post("/add-image/:productid", auth, productController.postImages);

router.delete("/delete/p/:productid", auth, productController.deleteProduct);
router.delete("/delete/i/:imageid", auth, productController.deleteProductImage);

module.exports = router;
