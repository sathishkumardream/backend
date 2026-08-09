const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CART_INCLUDE = {
  items: {
    include: { product: true, variant: true }
  }
};


// 🛒 Get Cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ from JWT

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE
    });

    // create cart if not exists
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: CART_INCLUDE
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
    const { productId, quantity, variantId } = req.body;

    // ✅ check product FIRST
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(400).json({ error: "Product not found" });
    }

    // If a variant was specified, make sure it actually belongs to this product
    let variant = null;
    if (variantId) {
      variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant || variant.productId !== productId) {
        return res.status(400).json({ error: "Variant not found for this product" });
      }
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

    // check if this exact product+variant combination is already in the cart.
    // (findFirst instead of a DB unique constraint, since variantId can be null
    // for simple products and Postgres treats NULL as never equal to NULL.)
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null
      }
    });

    // update quantity if exists
    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true, variant: true }
      });

      return res.json(updatedItem);
    }

    // create new item
    const item = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity
      },
      include: { product: true, variant: true }
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
      data: { quantity },
      include: { product: true, variant: true }
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
