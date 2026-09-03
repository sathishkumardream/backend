const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const { getPromoBanner, updatePromoBanner } = require("../controllers/promoBannerController");

router.get("/", getPromoBanner);
router.put("/", authMiddleware, adminMiddleware, updatePromoBanner);

module.exports = router;
