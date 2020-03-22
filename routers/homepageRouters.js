const router = require("express").Router();
const { homepageController } = require("../controllers");

router.get("/slider", homepageController.getImageSlider);
router.get("/slideshow", homepageController.getImageSlideshow);

module.exports = router;
