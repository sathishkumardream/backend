const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { getOverview } = require("../controllers/dashboardController");

router.get("/overview", authMiddleware, adminMiddleware, getOverview);

module.exports = router;
