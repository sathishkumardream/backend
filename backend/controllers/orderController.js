const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


const FREE_SHIP_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 60;

// 🛒 CREATE ORDER (Checkout)
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { couponCode, paymentMethod, address } = req.body;

    // 1. Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    // 2. Check if cart is empty
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 3. Verify stock availability before placing the order
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          message: `Not enough stock for "${item.product.name}". Only ${item.product.stock} left.`
        });
      }
    }

    // 4. Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + item.quantity * item.product.price;
    }, 0);

    // 5. Apply coupon (re-validated server-side, never trust the client)
    let discount = 0;
    let promotion = null;
    if (couponCode) {
      promotion = await prisma.promotion.findUnique({
        where: { code: couponCode.trim().toUpperCase() }
      });

      if (!promotion || !promotion.active) {
        return res.status(400).json({ message: "Invalid or inactive coupon code" });
      }
      if (promotion.expiresAt && new Date(promotion.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This coupon has expired" });
      }
      if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
        return res.status(400).json({ message: "This coupon has reached its usage limit" });
      }
      if (subtotal < promotion.minOrderValue) {
        return res.status(400).json({
          message: `Minimum order value for this coupon is ₹${promotion.minOrderValue}`
        });
      }

      if (promotion.type === "PERCENT") discount = Math.round((subtotal * promotion.value) / 100);
      if (promotion.type === "FLAT") discount = Math.min(promotion.value, subtotal);
    }

    // 6. Shipping fee
    const waiveShipping = promotion?.type === "SHIPPING" || (subtotal - discount) >= FREE_SHIP_THRESHOLD;
    const shippingFee = waiveShipping ? 0 : STANDARD_SHIPPING_FEE;

    const total = Math.max(subtotal - discount, 0) + shippingFee;

    // 7. Create order + decrement stock atomically
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          subtotal,
          discount,
          shippingFee,
          total,
          paymentMethod: paymentMethod || "COD",
          promotionId: promotion ? promotion.id : null,
          shippingName: address?.name || null,
          shippingPhone: address?.phone || null,
          shippingLine1: address?.line1 || null,
          shippingLine2: address?.line2 || null,
          shippingCity: address?.city || null,
          shippingState: address?.state || null,
          shippingPincode: address?.pincode || null,
          orderItems: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price
            }))
          }
        },
        include: {
          orderItems: { include: { product: true } }
        }
      });

      // Decrement stock for each purchased product
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // Track coupon usage
      if (promotion) {
        await tx.promotion.update({
          where: { id: promotion.id },
          data: { usedCount: { increment: 1 } }
        });
      }

      // Clear the cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    res.json({
      message: "Order placed successfully",
      order
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};



// 👤 GET USER ORDERS
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: { product: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// 👤 GET SINGLE ORDER
exports.getOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the order's owner or an admin may view it
    if (order.userId !== req.user.userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// 👑 ADMIN — GET ALL ORDERS
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: { product: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// 🔄 ADMIN — UPDATE ORDER STATUS
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // ✅ Validate status
    const validStatuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status }
    });

    res.json({
      message: "Order status updated",
      order
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
