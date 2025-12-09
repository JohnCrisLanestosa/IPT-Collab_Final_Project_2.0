require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify question function
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createSuperAdmin() {
  try {
    console.log("🛡️  BukSu EEU - Super Admin Creator\n");

    // Get credentials from user
    console.log("Please enter Super Admin details:\n");
    const userName = await question("Username: ");
    const email = await question("Email: ");
    const password = await question("Password: ");

    if (!userName || !email || !password) {
      console.log("\n❌ All fields are required!");
      rl.close();
      process.exit(1);
    }

    // Connect to MongoDB
    console.log("\n📡 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Import User model after connection
    const User = require("../models/User");

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ A user with this email already exists!");
      
      if (existingUser.role === "superadmin") {
        console.log("   This user is already a Super Admin.");
      } else {
        const upgrade = await question(
          `\n   This user has role: "${existingUser.role}"\n   Upgrade to Super Admin? (yes/no): `
        );
        
        if (upgrade.toLowerCase() === "yes" || upgrade.toLowerCase() === "y") {
          existingUser.role = "superadmin";
          await existingUser.save();
          console.log("\n✅ User upgraded to Super Admin successfully!");
          console.log("📧 Email:", email);
          console.log("🛡️  Role: superadmin");
        } else {
          console.log("\n❌ Operation cancelled.");
        }
      }
      
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash password
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create Super Admin
    const superAdmin = new User({
      userName,
      email,
      password: hashedPassword,
      role: "superadmin",
      authProvider: "local",
    });

    await superAdmin.save();

    console.log("\n✅ Super Admin created successfully!\n");
    console.log("═══════════════════════════════════════");
    console.log("📧 Email:    ", email);
    console.log("👤 Username: ", userName);
    console.log("🛡️  Role:     superadmin");
    console.log("═══════════════════════════════════════");
    console.log("\n⚠️  IMPORTANT: Store these credentials securely!");
    console.log("📱 You can now login at: http://localhost:5173\n");

    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating Super Admin:", error.message);
    rl.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();

