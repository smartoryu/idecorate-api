const router = require("express").Router();
const { authController } = require("../controllers");
const { auth } = require("../helpers/jwt-auth");

router.get("/hashpassword", authController.hashpassword);
router.get("/check_username", authController.checkUsername);

router.post("/register", authController.register);
router.post("/verify", authController.verifyAccount);

router.get("/login", authController.login);
router.get("/keeplogin", auth, authController.keeplogin);

module.exports = router;
