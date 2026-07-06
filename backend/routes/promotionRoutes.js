const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  createPromotion,
  getPromotions,
  updatePromotion,
  deletePromotion,
  validatePromotion,
} = require("../controllers/promotionController");

// 🌐 PUBLIC — validate a coupon at checkout
router.post("/validate", validatePromotion);

// 👑 ADMIN ONLY — manage promotions
router.get("/", authMiddleware, adminMiddleware, getPromotions);
router.post("/", authMiddleware, adminMiddleware, createPromotion);
router.put("/:id", authMiddleware, adminMiddleware, updatePromotion);
router.delete("/:id", authMiddleware, adminMiddleware, deletePromotion);

module.exports = router;
