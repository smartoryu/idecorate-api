const router = require("express").Router();
const { partnerController } = require("../controllers");

router.get("/", partnerController.getStore);

module.exports = router;
