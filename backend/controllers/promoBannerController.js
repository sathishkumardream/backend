const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 🌐 PUBLIC — used by the storefront to render the "End of Season Sale" style
// announcement banner. Headline/subtext/badges/CTA stay hardcoded — admins
// can only override the background.
exports.getPromoBanner = async (req, res) => {
  try {
    let settings = await prisma.promoBanner.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.promoBanner.create({ data: { id: 1, backgroundType: "default" } });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👑 ADMIN — set or clear the promo banner background
exports.updatePromoBanner = async (req, res) => {
  try {
    const { backgroundType, backgroundImage, backgroundColor } = req.body;

    if (!["default", "image", "color"].includes(backgroundType)) {
      return res.status(400).json({ error: "backgroundType must be 'default', 'image', or 'color'" });
    }
    if (backgroundType === "image" && !backgroundImage) {
      return res.status(400).json({ error: "backgroundImage is required when backgroundType is 'image'" });
    }
    if (backgroundType === "color" && !backgroundColor) {
      return res.status(400).json({ error: "backgroundColor is required when backgroundType is 'color'" });
    }

    const data = {
      backgroundType,
      backgroundImage: backgroundType === "image" ? backgroundImage : null,
      backgroundColor: backgroundType === "color" ? backgroundColor : null,
    };

    const settings = await prisma.promoBanner.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
