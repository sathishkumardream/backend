const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const { getStitchingSettings, updateStitchingSettings } = require("../controllers/stitchingSettingsController");

router.get("/", getStitchingSettings);
router.put("/", authMiddleware, adminMiddleware, updateStitchingSettings);

module.exports = router;
