const router = require("express").Router();
const { authController } = require("../controllers");

router.get("/hashpassword", authController.hashpassword);

router.get("/login", authController.login);
router.get("/login/:id", authController.login);

router.get("/check_username", authController.checkUsername);
router.post("/register", authController.register);

module.exports = router;
