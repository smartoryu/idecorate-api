const router = require("express").Router();
const { homepageController } = require("../controllers");

router.get("/slider", homepageController.getImageSlider);
router.get("/slideshow", homepageController.getImageSlideshow);
router.get("/p/get_types", homepageController.getTypes);
router.get("/p/get_details/:productid", homepageController.getDetails);
router.get("/p/get5Random", homepageController.get5RandomProductPerType);

module.exports = router;
