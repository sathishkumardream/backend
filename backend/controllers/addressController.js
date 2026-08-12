const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 👤 GET all of the logged-in user's addresses
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ➕ CREATE a new address
exports.createAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { label, name, phone, line1, line2, city, state, pincode, isDefault } = req.body;

    if (!name || !phone || !line1 || !city || !pincode) {
      return res.status(400).json({ message: "Name, phone, address line 1, city, and pincode are required" });
    }

    // If this is the user's first address, or they explicitly marked it default,
    // make sure it's the only one flagged as default.
    const existingCount = await prisma.address.count({ where: { userId } });
    const shouldBeDefault = isDefault === true || existingCount === 0;

    if (shouldBeDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label: label || "Home",
        name, phone, line1,
        line2: line2 || null,
        city,
        state: state || null,
        pincode,
        isDefault: shouldBeDefault,
      }
    });

    res.json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔄 UPDATE an address
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { label, name, phone, line1, line2, city, state, pincode, isDefault } = req.body;

    if (isDefault === true) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const data = {};
    if (label !== undefined) data.label = label;
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (line1 !== undefined) data.line1 = line1;
    if (line2 !== undefined) data.line2 = line2 || null;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state || null;
    if (pincode !== undefined) data.pincode = pincode;
    if (isDefault !== undefined) data.isDefault = Boolean(isDefault);

    const address = await prisma.address.update({ where: { id }, data });
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ❌ DELETE an address
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await prisma.address.delete({ where: { id } });

    // If we just deleted the default address, promote the most recently added remaining one
    if (existing.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }

    res.json({ message: "Address deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
