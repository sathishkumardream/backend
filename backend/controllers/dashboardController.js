const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 👑 ADMIN — Overview stats + charts data
exports.getOverview = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalRevenueAgg,
      totalOrders,
      totalProducts,
      totalUsers,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      allOrdersLast30,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "PENDING" } },
      }),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        orderBy: { stock: "asc" },
        take: 10,
        select: { id: true, name: true, stock: true, image: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, total: true, status: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    // Revenue by day (last 30 days) for a chart
    const revenueByDayMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      revenueByDayMap[key] = 0;
    }
    allOrdersLast30.forEach((o) => {
      if (o.status === "PENDING") return;
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (revenueByDayMap[key] !== undefined) revenueByDayMap[key] += o.total;
    });
    const revenueByDay = Object.entries(revenueByDayMap).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue),
    }));

    // Top selling products (by quantity sold)
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
    const topProductIds = topProductsRaw.map((p) => p.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, image: true },
    });
    const topProducts = topProductsRaw.map((p) => {
      const detail = topProductDetails.find((d) => d.id === p.productId);
      return {
        productId: p.productId,
        name: detail?.name || "Unknown",
        image: detail?.image || null,
        unitsSold: p._sum.quantity || 0,
        revenue: Math.round((p._sum.price || 0)),
      };
    });

    res.json({
      totalRevenue: Math.round(totalRevenueAgg._sum.total || 0),
      totalOrders,
      totalProducts,
      totalUsers,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      revenueByDay,
      topProducts,
      ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count._all })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
