const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_SIZE_PRICING = { XS: 449, S: 499, M: 599, L: 699, XL: 799, XXL: 899, XXXL: 999 };

// 🌐 PUBLIC — used by the storefront to compute live pricing
exports.getStitchingSettings = async (req, res) => {
  try {
    let settings = await prisma.stitchingSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.stitchingSettings.create({
        data: { id: 1, sizePricing: DEFAULT_SIZE_PRICING, ownFabricFee: 799 }
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👑 ADMIN — update the stitching fee table
exports.updateStitchingSettings = async (req, res) => {
  try {
    const { sizePricing, ownFabricFee } = req.body;

    const data = {};
    if (sizePricing !== undefined) data.sizePricing = sizePricing;
    if (ownFabricFee !== undefined) data.ownFabricFee = Number(ownFabricFee);

    const settings = await prisma.stitchingSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, sizePricing: sizePricing || DEFAULT_SIZE_PRICING, ownFabricFee: ownFabricFee ? Number(ownFabricFee) : 799 }
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
