const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


// 🛒 Get Cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ from JWT

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    // create cart if not exists
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: true
        }
      });
    }

    res.json(cart);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ➕ Add to Cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ from JWT
    const { productId, quantity } = req.body;

    // ✅ check product FIRST
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(400).json({ error: "Product not found" });
    }

    // find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      });
    }

    // check if item already exists
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });

    // update quantity if exists
    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        },
        data: {
          quantity: existingItem.quantity + quantity
        }
      });

      return res.json(updatedItem);
    }

    // create new item
    const item = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity
      }
    });

    res.json(item);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};


// 🔄 Update Quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { quantity } = req.body;

    // optional: verify item belongs to user
    const item = await prisma.cartItem.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        cart: true
      }
    });

    if (!item || item.cart.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: Number(req.params.id) },
      data: { quantity }
    });

    res.json(updatedItem);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ❌ Remove Item
exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;

    const item = await prisma.cartItem.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        cart: true
      }
    });

    if (!item || item.cart.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.cartItem.delete({
      where: { id: Number(req.params.id) }
    });

    res.json({ message: "Item removed" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};