const router = require("express").Router();
const { partnerController } = require("../controllers");

router.get("/", partnerController.getStore);
router.put("/edit/:storeid", partnerController.updateStore);

module.exports = router;
