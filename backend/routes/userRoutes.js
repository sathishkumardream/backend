const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getMe, updateProfile, changePassword, updatePaymentPreference } = require("../controllers/userController");

router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);
router.put("/payment-preference", authMiddleware, updatePaymentPreference);

module.exports = router;
