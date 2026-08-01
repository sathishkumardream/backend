const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Flat stitching-service fees, used when a design's own pricing doesn't apply.
// (No admin UI to configure these yet — easy to move into settings later if needed.)
const STITCHING_ONLY_FEE = 799;       // customer provides their own fabric
const STORE_FABRIC_STITCHING_FEE = 599; // added on top of a real store product's price

const CUSTOM_ORDER_INCLUDE = { design: true, sourceProduct: true };
const VALID_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "SHIPPED", "DELIVERED"];

// 🛍️ CREATE — customer submits a "Made For You" request
exports.createCustomOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      designId, sourceProductId, comboType, fabricType, fabricChoice,
      sizeMode, standardSize, measurements, notes
    } = req.body;

    if (!comboType || !fabricType || !sizeMode) {
      return res.status(400).json({ message: "comboType, fabricType, and sizeMode are required" });
    }
    if (sizeMode === "standard" && !standardSize) {
      return res.status(400).json({ message: "Please select a standard size" });
    }
    if (sizeMode === "custom" && (!measurements || Object.keys(measurements).length === 0)) {
      return res.status(400).json({ message: "Please provide your measurements" });
    }

    // Price is always computed server-side — never trust a price sent from the client.
    let price;
    let design = null;
    let sourceProduct = null;

    if (fabricType === "design") {
      if (!designId) return res.status(400).json({ message: "Please select a design" });
      design = await prisma.customDesign.findUnique({ where: { id: designId } });
      if (!design || !design.active) return res.status(400).json({ message: "That design is no longer available" });

      if (sizeMode === "standard" && design.sizePricing && design.sizePricing[standardSize] != null) {
        price = Number(design.sizePricing[standardSize]);
      } else {
        price = design.basePrice;
      }
    } else if (fabricType === "store-product") {
      if (!sourceProductId) return res.status(400).json({ message: "Please select a saree from the store" });
      sourceProduct = await prisma.product.findUnique({ where: { id: sourceProductId } });
      if (!sourceProduct || !sourceProduct.active) return res.status(400).json({ message: "That product is no longer available" });
      price = sourceProduct.price + STORE_FABRIC_STITCHING_FEE;
    } else {
      // "own" — customer supplies their own fabric, just paying for stitching
      price = STITCHING_ONLY_FEE;
    }

    const customOrder = await prisma.customOrder.create({
      data: {
        userId,
        designId: design ? design.id : null,
        sourceProductId: sourceProduct ? sourceProduct.id : null,
        comboType,
        fabricType,
        fabricChoice: fabricChoice || null,
        sizeMode,
        standardSize: standardSize || null,
        measurements: measurements || undefined,
        notes: notes || null,
        price,
      },
      include: CUSTOM_ORDER_INCLUDE
    });

    res.json({ message: "Custom order request submitted", customOrder });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// 👤 GET — the logged-in customer's own custom orders ("My Custom Orders")
exports.getMyCustomOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const customOrders = await prisma.customOrder.findMany({
      where: { userId },
      include: CUSTOM_ORDER_INCLUDE,
      orderBy: { createdAt: "desc" }
    });
    res.json(customOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👑 ADMIN — all custom orders
exports.getAllCustomOrders = async (req, res) => {
  try {
    const customOrders = await prisma.customOrder.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        ...CUSTOM_ORDER_INCLUDE
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(customOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔄 ADMIN — update status
exports.updateCustomOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const customOrder = await prisma.customOrder.update({
      where: { id: Number(req.params.id) },
      data: { status }
    });
    res.json({ message: "Status updated", customOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
