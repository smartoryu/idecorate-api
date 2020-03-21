const router = require("express").Router();
const { partnerController } = require("../controllers");
const { auth } = require("../helpers/jwt-auth");

router.get("/", auth, partnerController.getStore);
router.post("/create", auth, partnerController.createStore);
router.put("/edit/:storeid", partnerController.updateStore);

module.exports = router;
