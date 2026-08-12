const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");

// 👤 GET current user's profile
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, email: true, role: true,
        preferredPaymentMethod: true, savedUpiId: true, createdAt: true
      }
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✏️ UPDATE profile (name only — email changes aren't supported yet since that
// would need its own re-verification flow to stay secure)
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔒 CHANGE PASSWORD — requires the current password for confirmation
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 💳 UPDATE payment preference (default method + optional UPI ID for reference —
// no card numbers are ever stored here; real card payments need a proper gateway integration)
exports.updatePaymentPreference = async (req, res) => {
  try {
    const { preferredPaymentMethod, savedUpiId } = req.body;
    const validMethods = ["COD", "UPI", "CARD"];

    const data = {};
    if (preferredPaymentMethod !== undefined) {
      if (!validMethods.includes(preferredPaymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }
      data.preferredPaymentMethod = preferredPaymentMethod;
    }
    if (savedUpiId !== undefined) data.savedUpiId = savedUpiId || null;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: { preferredPaymentMethod: true, savedUpiId: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
