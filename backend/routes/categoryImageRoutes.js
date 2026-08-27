const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const { getCategoryImages, updateCategoryImage } = require("../controllers/categoryImageController");

router.get("/", getCategoryImages);
router.put("/:key", authMiddleware, adminMiddleware, updateCategoryImage);

module.exports = router;
