const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const { getHeroSlideBackgrounds, updateHeroSlideBackground } = require("../controllers/heroBannerController");

router.get("/", getHeroSlideBackgrounds);
router.put("/:slideKey", authMiddleware, adminMiddleware, updateHeroSlideBackground);

module.exports = router;
