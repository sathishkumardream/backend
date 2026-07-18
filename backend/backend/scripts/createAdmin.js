/**
 * Creates (or promotes) an admin user.
 *
 * Usage:
 *   node scripts/createAdmin.js admin@example.com "Admin Name" "StrongPassword123"
 *
 * If a user with that email already exists, it will be promoted to ADMIN
 * (password is left unchanged). Otherwise a new ADMIN user is created.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const [, , email, name, password] = process.argv;

  if (!email || !password) {
    console.error('Usage: node scripts/createAdmin.js <email> "<name>" <password>');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });
    console.log(`✅ Existing user "${updated.email}" promoted to ADMIN.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name || "Admin",
      email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin user created: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
