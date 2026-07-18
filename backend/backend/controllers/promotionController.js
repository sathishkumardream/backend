const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 👑 ADMIN — Create Promotion
exports.createPromotion = async (req, res) => {
  try {
    const { code, type, value, minOrderValue, active, expiresAt, usageLimit } = req.body;

    if (!code || !type) {
      return res.status(400).json({ error: "code and type are required" });
    }
    if (!["PERCENT", "FLAT", "SHIPPING"].includes(type)) {
      return res.status(400).json({ error: "type must be PERCENT, FLAT, or SHIPPING" });
    }

    const promotion = await prisma.promotion.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: value ? Number(value) : 0,
        minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
        active: active !== undefined ? Boolean(active) : true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
      },
    });

    res.json(promotion);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "A promotion with this code already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

// 👑 ADMIN — Get all promotions
exports.getPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👑 ADMIN — Update promotion
exports.updatePromotion = async (req, res) => {
  try {
    const { code, type, value, minOrderValue, active, expiresAt, usageLimit } = req.body;

    const data = {};
    if (code !== undefined) data.code = code.trim().toUpperCase();
    if (type !== undefined) data.type = type;
    if (value !== undefined) data.value = Number(value);
    if (minOrderValue !== undefined) data.minOrderValue = Number(minOrderValue);
    if (active !== undefined) data.active = Boolean(active);
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (usageLimit !== undefined) data.usageLimit = usageLimit ? Number(usageLimit) : null;

    const promotion = await prisma.promotion.update({
      where: { id: Number(req.params.id) },
      data,
    });

    res.json(promotion);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "A promotion with this code already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

// 👑 ADMIN — Delete promotion
exports.deletePromotion = async (req, res) => {
  try {
    await prisma.promotion.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Promotion deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🌐 PUBLIC — Validate a coupon code against a cart subtotal
// Returns the computed discount/shipping waiver WITHOUT mutating usage count.
// Usage count is only incremented when an order is actually placed (see orderController).
exports.validatePromotion = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) return res.status(400).json({ error: "Coupon code is required" });

    const promotion = await prisma.promotion.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promotion || !promotion.active) {
      return res.status(404).json({ error: "Invalid or inactive coupon code" });
    }

    if (promotion.expiresAt && new Date(promotion.expiresAt) < new Date()) {
      return res.status(400).json({ error: "This coupon has expired" });
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return res.status(400).json({ error: "This coupon has reached its usage limit" });
    }

    const sub = Number(subtotal) || 0;
    if (sub < promotion.minOrderValue) {
      return res.status(400).json({
        error: `Minimum order value for this coupon is ₹${promotion.minOrderValue}`,
      });
    }

    let discount = 0;
    if (promotion.type === "PERCENT") discount = Math.round((sub * promotion.value) / 100);
    if (promotion.type === "FLAT") discount = Math.min(promotion.value, sub);
    // SHIPPING type has 0 direct discount here — frontend/order logic waives shipping fee instead

    res.json({
      valid: true,
      promotion: {
        id: promotion.id,
        code: promotion.code,
        type: promotion.type,
        value: promotion.value,
      },
      discount,
      waiveShipping: promotion.type === "SHIPPING",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
