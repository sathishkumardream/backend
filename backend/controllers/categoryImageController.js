const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const VALID_KEYS = ["men", "women", "boys", "girls"];

// 🌐 PUBLIC — used by the storefront to render "Shop by Category" cards.
// Returns a { men: "...", women: null, ... } map so the frontend can just
// look up each key directly and fall back to its default design when null.
exports.getCategoryImages = async (req, res) => {
  try {
    const rows = await prisma.categoryImage.findMany();
    const map = {};
    for (const key of VALID_KEYS) map[key] = null;
    for (const row of rows) map[row.key] = row.imageUrl || null;
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👑 ADMIN — set or clear one category's image. Pass imageUrl: null (or omit it)
// to reset that category back to the default gradient + emoji card.
exports.updateCategoryImage = async (req, res) => {
  try {
    const { key } = req.params;
    const { imageUrl } = req.body;

    if (!VALID_KEYS.includes(key)) {
      return res.status(400).json({ error: `key must be one of: ${VALID_KEYS.join(", ")}` });
    }

    const row = await prisma.categoryImage.upsert({
      where: { key },
      update: { imageUrl: imageUrl || null },
      create: { key, imageUrl: imageUrl || null },
    });

    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
