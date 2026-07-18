const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem
} = require("../controllers/cartController");

// 🔐 Protect ALL cart routes
router.get("/", authMiddleware, getCart);
router.post("/", authMiddleware, addToCart);
router.put("/:id", authMiddleware, updateCartItem);
router.delete("/:id", authMiddleware, removeCartItem);

module.exports = router;