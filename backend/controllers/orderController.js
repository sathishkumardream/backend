const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const FREE_SHIP_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 60;

const ORDER_ITEM_INCLUDE = { orderItems: { include: { product: true, variant: true } } };

// 🛒 CREATE ORDER (Checkout)
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { couponCode, paymentMethod, address } = req.body;

    // 1. Get cart with items (including variant, if any)
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true, variant: true }
        }
      }
    });

    // 2. Check if cart is empty
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 3. Verify stock availability before placing the order.
    // When an item has a variant, that variant's own stock is authoritative —
    // otherwise fall back to the product's stock (simple, non-variant products).
    for (const item of cart.items) {
      const availableStock = item.variant ? item.variant.stock : item.product.stock;
      const label = item.variant
        ? `${item.product.name} (${[item.variant.size, item.variant.color].filter(Boolean).join(" / ")})`
        : item.product.name;

      if (item.quantity > availableStock) {
        return res.status(400).json({
          message: `Not enough stock for "${label}". Only ${availableStock} left.`
        });
      }
    }

    // 4. Calculate subtotal — a variant's own price overrides the product price if set.
    const priceOf = (item) => (item.variant?.price ?? item.product.price);
    const subtotal = cart.items.reduce((sum, item) => sum + item.quantity * priceOf(item), 0);

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
              variantId: item.variantId || null,
              quantity: item.quantity,
              price: priceOf(item)
            }))
          }
        },
        include: ORDER_ITEM_INCLUDE
      });

      // Decrement stock — the variant's stock if this item has one, otherwise the product's.
      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } }
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
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
      include: ORDER_ITEM_INCLUDE,
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
      include: ORDER_ITEM_INCLUDE
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
        ...ORDER_ITEM_INCLUDE
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
