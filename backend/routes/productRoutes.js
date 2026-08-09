const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  getBulkUploadTemplate,
  bulkUploadProducts,
} = require("../controllers/productController");


// 🌐 PUBLIC ROUTES (no login required)
// NOTE: these specific routes must be registered before the "/:id" wildcard below,
// otherwise Express would treat "bulk-upload-template" etc. as a product id.
router.get("/bulk-upload/template", authMiddleware, adminMiddleware, getBulkUploadTemplate);
router.post("/bulk-upload", authMiddleware, adminMiddleware, bulkUploadProducts);

router.get("/", getProducts);
router.get("/:id", getProduct);


// 🔐 ADMIN ONLY ROUTES
router.post("/", authMiddleware, adminMiddleware, createProduct);
router.put("/:id", authMiddleware, adminMiddleware, updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

// Variants
router.post("/:productId/variants", authMiddleware, adminMiddleware, createVariant);
router.put("/variants/:id", authMiddleware, adminMiddleware, updateVariant);
router.delete("/variants/:id", authMiddleware, adminMiddleware, deleteVariant);


module.exports = router;
