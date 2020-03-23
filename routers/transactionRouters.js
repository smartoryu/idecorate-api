const router = require("express").Router();
const { transactionController } = require("../controllers");
const { auth } = require("../helpers/jwt-auth");

router.get("/get", auth, transactionController.getCart);
router.post("/post", auth, transactionController.postToCart);
router.put("/update/:transdetailsid", auth, transactionController.putCart);
router.delete("/delete/:transdetailsid", auth, transactionController.deleteFromCart);

module.exports = router;
