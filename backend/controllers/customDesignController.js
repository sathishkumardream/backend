const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 🌐 PUBLIC — active designs for the storefront gallery
exports.getDesigns = async (req, res) => {
  try {
    const where = req.query.activeOnly === "true" ? { active: true } : {};
    const designs = await prisma.customDesign.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json(designs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👑 ADMIN — create a design
exports.createDesign = async (req, res) => {
  try {
    const { name, image, comboType, tag, basePrice, sizePricing } = req.body;

    if (!name || !image || !comboType || !basePrice) {
      return res.status(400).json({ error: "name, image, comboType, and basePrice are required" });
    }

    const design = await prisma.customDesign.create({
      data: {
        name,
        image,
        comboType,
        tag: tag || null,
        basePrice: Number(basePrice),
        sizePricing: sizePricing && Object.keys(sizePricing).length > 0 ? sizePricing : undefined,
      }
    });

    res.json(design);
  } catch (error) {
    res.status(500).json({ error: error.message || "Error creating design" });
  }
};

// 👑 ADMIN — update a design
exports.updateDesign = async (req, res) => {
  try {
    const { name, image, comboType, tag, basePrice, sizePricing, active } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (image !== undefined) data.image = image;
    if (comboType !== undefined) data.comboType = comboType;
    if (tag !== undefined) data.tag = tag || null;
    if (basePrice !== undefined) data.basePrice = Number(basePrice);
    if (sizePricing !== undefined) data.sizePricing = sizePricing && Object.keys(sizePricing).length > 0 ? sizePricing : null;
    if (active !== undefined) data.active = Boolean(active);

    const design = await prisma.customDesign.update({
      where: { id: Number(req.params.id) },
      data
    });

    res.json(design);
  } catch (error) {
    res.status(500).json({ error: error.message || "Error updating design" });
  }
};

// 👑 ADMIN — delete a design (soft — designs referenced by past custom orders can't be hard-deleted safely)
exports.deleteDesign = async (req, res) => {
  try {
    const design = await prisma.customDesign.update({
      where: { id: Number(req.params.id) },
      data: { active: false }
    });
    res.json({ message: "Design archived", design });
  } catch (error) {
    res.status(500).json({ error: error.message || "Error archiving design" });
  }
};
