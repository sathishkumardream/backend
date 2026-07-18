const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const category = await prisma.category.create({
      data: { name }
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Error creating category" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { products: true }
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error fetching categories" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const category = await prisma.category.update({
      where: { id: Number(req.params.id) },
      data: { name }
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Error updating category" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting category" });
  }
};