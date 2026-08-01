const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  createCustomOrder,
  getMyCustomOrders,
  getAllCustomOrders,
  updateCustomOrderStatus,
} = require("../controllers/customOrderController");

// 👤 CUSTOMER (must be logged in)
router.post("/", authMiddleware, createCustomOrder);
router.get("/", authMiddleware, getMyCustomOrders);

// 👑 ADMIN ONLY
router.get("/admin/all", authMiddleware, adminMiddleware, getAllCustomOrders);
router.put("/:id/status", authMiddleware, adminMiddleware, updateCustomOrderStatus);

module.exports = router;
