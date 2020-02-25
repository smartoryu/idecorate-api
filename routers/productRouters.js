const router = require("express").Router();
const { productController } = require("../controllers");

router.post("/add", productController.postProduct);

module.exports = router;
