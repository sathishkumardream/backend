const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required", message: "Name, email, and password are required" });
    }

    // ADD THIS CHECK
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists", message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    // Log the user in immediately after registering
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// FORGOT PASSWORD — request a reset link
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required", message: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return the same generic response whether or not the account exists —
    // this prevents attackers from using this endpoint to discover which emails are registered.
    const genericResponse = {
      message: "If an account exists for that email, a password reset link has been sent."
    };

    if (!user) {
      return res.json(genericResponse);
    }

    // Generate a random token. We store only its SHA-256 hash in the database —
    // exactly like we do with passwords — so a database leak alone can't be used to reset accounts.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: expiry }
    });

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim();
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    // Respond immediately — don't make the user wait on email delivery, which can be slow
    // or fail. The email is sent in the background; any failure is only logged server-side.
    res.json(genericResponse);

    sendEmail({
      to: user.email,
      subject: "Reset your Elma's Fashion password",
      html: `
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. This link expires in 1 hour:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      text: `Reset your password: ${resetLink} (expires in 1 hour). If you didn't request this, ignore this email.`
    }).catch((emailError) => {
      console.error("Failed to send password reset email:", emailError.message);
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// RESET PASSWORD — using the token from the emailed link
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required", message: "Token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters", message: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: "This reset link is invalid or has expired. Please request a new one.",
        message: "This reset link is invalid or has expired. Please request a new one."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: "Password reset successfully. You can now log in with your new password." });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};