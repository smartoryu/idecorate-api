const router = require("express").Router();
const { cartController } = require("../controllers");
const { auth } = require("../helpers/jwt-auth");

router.get("/get", auth, cartController.getCart);

router.post("/post", auth, cartController.postToCart);

router.put("/update/:transdetailsid", auth, cartController.putCart);
router.delete("/delete/:transdetailsid", auth, cartController.deleteFromCart);

module.exports = router;
