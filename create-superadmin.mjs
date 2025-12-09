import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

async function createSuperadmin() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    const email = "admin@orbitdut.com";
    const password = "Shogun12!";
    const name = "Super Admin";

    // Check if user already exists
    const [existing] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      console.log("User already exists, updating to superadmin role...");
      await connection.execute(
        "UPDATE users SET role = 'superadmin' WHERE email = ?",
        [email]
      );
      console.log("✅ User updated to superadmin role");
    } else {
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      await connection.execute(
        `INSERT INTO users (name, email, passwordHash, accountType, loginMethod, role, lastSignedIn)
         VALUES (?, ?, ?, 'customer', 'local', 'superadmin', NOW())`,
        [name, email, passwordHash]
      );

      console.log("✅ Superadmin account created successfully");
    }

    console.log("\nLogin credentials:");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("\nAccess the superadmin panel at: /superadmin");
  } catch (error) {
    console.error("Error creating superadmin:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

createSuperadmin();
