const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const orderController = require("../controllers/orderController");


// 👤 USER ROUTES
router.post("/", authMiddleware, orderController.createOrder);
router.get("/", authMiddleware, orderController.getOrders);

// 👑 ADMIN ROUTES
router.get("/admin/all", authMiddleware, adminMiddleware, orderController.getAllOrders);
router.put("/:id/status", authMiddleware, adminMiddleware, orderController.updateOrderStatus);

// 👤 SINGLE ORDER (KEEP LAST)
router.get("/:id", authMiddleware, orderController.getOrderById);

module.exports = router;