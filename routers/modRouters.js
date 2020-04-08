const router = require("express").Router();
const { auth } = require("../helpers/jwt-auth");
const { modController } = require("../controllers");

router.put("/payment/confirm/:id", auth, modController.putPaymentToConfirmed);
router.put("/payment/cancel/:id", auth, modController.putPaymentToPaid);
router.put("/order/pick/:id", auth, modController.pickOrderToProccess);

module.exports = router;
