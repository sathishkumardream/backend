const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getAddresses, createAddress, updateAddress, deleteAddress } = require("../controllers/addressController");

router.get("/", authMiddleware, getAddresses);
router.post("/", authMiddleware, createAddress);
router.put("/:id", authMiddleware, updateAddress);
router.delete("/:id", authMiddleware, deleteAddress);

module.exports = router;
