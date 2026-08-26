const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const { getHeroBanner, updateHeroBanner } = require("../controllers/heroBannerController");

router.get("/", getHeroBanner);
router.put("/", authMiddleware, adminMiddleware, updateHeroBanner);

module.exports = router;
