const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


// Create Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, stock, image, sizes, colors, categoryId } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        stock,
        image,
        sizes: sizes || null,
        colors: colors || null,
        category: {
          connect: { id: categoryId }
        }
      }
    });

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message || "Error creating product" });
  }
};


// Get All Products
exports.getProducts = async (req, res) => {
  try {

    const products = await prisma.product.findMany({
      include: { category: true }
    });

    res.json(products);

  } catch (error) {
    res.status(500).json({ error: error.message || "Error fetching products" });
  }
};


// Get Single Product
exports.getProduct = async (req, res) => {

  try {

    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true }
    });

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message || "Error fetching product" });
  }

};


// Update Product
exports.updateProduct = async (req, res) => {

  try {

    const { name, description, price, originalPrice, stock, image, sizes, colors, categoryId } = req.body;

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        price,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        stock,
        image,
        sizes: sizes || null,
        colors: colors || null,
        categoryId
      }
    });

    res.json(product);

  } catch (error) {
    res.status(500).json({ error: error.message || "Error updating product" });
  }

};


// Delete Product
exports.deleteProduct = async (req, res) => {

  try {

    await prisma.product.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ message: "Product deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message || "Error deleting product" });
  }

};
