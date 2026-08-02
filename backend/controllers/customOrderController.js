const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CUSTOM_ORDER_INCLUDE = { design: true, sourceProduct: true };
const VALID_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "SHIPPED", "DELIVERED"];

async function getStitchingSettingsOrDefault() {
  const settings = await prisma.stitchingSettings.findUnique({ where: { id: 1 } });
  if (settings) return settings;
  return { sizePricing: { S: 499, M: 599, L: 699, XL: 799, XXL: 899 }, ownFabricFee: 799 };
}

// Computes one recipient's stitching cost from the global size-fee table.
// Custom (non-standard) measurements use the flat "ownFabricFee" as a stitching-labor baseline,
// since a garment made to bespoke measurements doesn't map to a fixed size bracket.
function stitchingCostFor(recipient, settings) {
  if (recipient.sizeMode === "standard" && recipient.standardSize) {
    const fee = settings.sizePricing?.[recipient.standardSize];
    if (fee != null) return Number(fee);
  }
  return settings.ownFabricFee;
}

// 🛍️ CREATE — customer submits a "Made For You" request
exports.createCustomOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      designId, sourceProductId, comboType, fabricType,
      recipients, blouseType, neckPattern, backDesign, referenceImage, notes
    } = req.body;

    if (!comboType || !fabricType) {
      return res.status(400).json({ message: "comboType and fabricType are required" });
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "Please add at least one person/garment to this combo request" });
    }
    for (const r of recipients) {
      if (!r.label) return res.status(400).json({ message: "Each garment needs a label (e.g. 'Mom', 'Daughter 1')" });
      if (r.sizeMode === "standard" && !r.standardSize) {
        return res.status(400).json({ message: `Please select a size for "${r.label}"` });
      }
      if (r.sizeMode === "custom" && (!r.measurements || Object.values(r.measurements).some(v => !v))) {
        return res.status(400).json({ message: `Please provide complete measurements for "${r.label}"` });
      }
    }

    // Fabric/design cost is always computed server-side — never trust a price sent from the client.
    let fabricCost;
    let design = null;
    let sourceProduct = null;

    if (fabricType === "design") {
      if (!designId) return res.status(400).json({ message: "Please select a design" });
      design = await prisma.customDesign.findUnique({ where: { id: designId } });
      if (!design || !design.active) return res.status(400).json({ message: "That design is no longer available" });
      fabricCost = design.basePrice;
    } else if (fabricType === "store-product") {
      if (!sourceProductId) return res.status(400).json({ message: "Please select a saree from the store" });
      sourceProduct = await prisma.product.findUnique({ where: { id: sourceProductId } });
      if (!sourceProduct || !sourceProduct.active) return res.status(400).json({ message: "That product is no longer available" });
      fabricCost = sourceProduct.price;
    } else {
      fabricCost = 0; // "own" — customer supplies their own fabric, no fabric cost to us
    }

    // Stitching cost: one garment per recipient, priced by size from the global fee table.
    const settings = await getStitchingSettingsOrDefault();
    const pricedRecipients = recipients.map(r => ({
      label: r.label,
      sizeMode: r.sizeMode,
      standardSize: r.sizeMode === "standard" ? r.standardSize : null,
      measurements: r.sizeMode === "custom" ? r.measurements : null,
      stitchingCost: stitchingCostFor(r, settings),
    }));
    const stitchingCost = pricedRecipients.reduce((sum, r) => sum + r.stitchingCost, 0);
    const price = fabricCost + stitchingCost;

    const customOrder = await prisma.customOrder.create({
      data: {
        userId,
        designId: design ? design.id : null,
        sourceProductId: sourceProduct ? sourceProduct.id : null,
        comboType,
        fabricType,
        recipients: pricedRecipients,
        blouseType: blouseType || null,
        neckPattern: neckPattern || null,
        backDesign: backDesign || null,
        referenceImage: referenceImage || null,
        notes: notes || null,
        fabricCost,
        stitchingCost,
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
