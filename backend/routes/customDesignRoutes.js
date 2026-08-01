const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getDesigns,
  createDesign,
  updateDesign,
  deleteDesign,
} = require("../controllers/customDesignController");

// 🌐 PUBLIC
router.get("/", getDesigns);

// 👑 ADMIN ONLY
router.post("/", authMiddleware, adminMiddleware, createDesign);
router.put("/:id", authMiddleware, adminMiddleware, updateDesign);
router.delete("/:id", authMiddleware, adminMiddleware, deleteDesign);

module.exports = router;
