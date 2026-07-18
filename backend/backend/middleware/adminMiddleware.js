module.exports = (req, res, next) => {
  try {
    // req.user comes from authMiddleware
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};