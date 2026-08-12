const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const customDesignRoutes = require("./routes/customDesignRoutes");
const customOrderRoutes = require("./routes/customOrderRoutes");
const stitchingSettingsRoutes = require("./routes/stitchingSettingsRoutes");
const addressRoutes = require("./routes/addressRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Allow a comma-separated list of origins via FRONTEND_URL (e.g. your Vercel URL).
// Falls back to "*" for local development if not set.
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : "*";

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "E-commerce API is running" });
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/custom-designs", customDesignRoutes);
app.use("/api/custom-orders", customOrderRoutes);
app.use("/api/stitching-settings", stitchingSettingsRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
