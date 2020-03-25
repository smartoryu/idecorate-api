const router = require("express").Router();
const { auth } = require("../helpers/jwt-auth");
const { orderController } = require("../controllers");

router.get("/get", auth, orderController.getOrderList);

router.post("/post", auth, orderController.postToOrder);
router.post("/post/:id/receipt/:invoice", auth, orderController.postReceipt);

router.delete("/delete/receipt/:id", auth, orderController.deleteReceipt);

module.exports = router;
