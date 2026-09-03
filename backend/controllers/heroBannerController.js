const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const VALID_SLIDES = ["slide1", "slide2", "slide3"];

// 🌐 PUBLIC — used by the storefront to render all 3 hero carousel slides.
// Returns a { slide1: {...}, slide2: {...}, slide3: {...} } map so the
// frontend can look up each slide directly and fall back to its own default
// gradient when a slide has no override (or backgroundType is "default").
exports.getHeroSlideBackgrounds = async (req, res) => {
  try {
    const rows = await prisma.heroSlideBackground.findMany();
    const map = {};
    for (const key of VALID_SLIDES) map[key] = { backgroundType: "default", backgroundImage: null, backgroundColor: null };
    for (const row of rows) {
      if (VALID_SLIDES.includes(row.slideKey)) {
        map[row.slideKey] = {
          backgroundType: row.backgroundType,
          backgroundImage: row.backgroundImage,
          backgroundColor: row.backgroundColor,
        };
      }
    }
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👑 ADMIN — set or clear one slide's background.
exports.updateHeroSlideBackground = async (req, res) => {
  try {
    const { slideKey } = req.params;
    const { backgroundType, backgroundImage, backgroundColor } = req.body;

    if (!VALID_SLIDES.includes(slideKey)) {
      return res.status(400).json({ error: `slideKey must be one of: ${VALID_SLIDES.join(", ")}` });
    }
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

    const row = await prisma.heroSlideBackground.upsert({
      where: { slideKey },
      update: data,
      create: { slideKey, ...data },
    });

    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
