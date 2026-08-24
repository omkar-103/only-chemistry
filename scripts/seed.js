#!/usr/bin/env node
// ============================================================
// Database Seed Script — Admin + Categories
// Run with: npm run seed
// ============================================================

const dns = require("dns");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // ignore
}

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin@RHG2024!";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// User Schema (minimal for seed)
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  mobile: String,
  password: String,
  role: String,
  isVerified: Boolean,
  isActive: Boolean,
  purchasedExams: [],
  totalTimeOnSite: { type: Number, default: 0 },
  otpAttempts: { type: Number, default: 0 },
}, { timestamps: true });

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

async function seed() {
  console.log("\n🌱 RHGConsultancyService Database Seeder");
  console.log("=".repeat(45));
  console.log("🔄 Connecting to MongoDB Atlas...");

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log("✅ Connected!\n");

  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  // ── Seed Admin ──────────────────────────────────────────────
  console.log("👤 Creating admin account...");
  const existingAdmin = await User.findOne({ email: "admin@rhgcs.in" });

  if (existingAdmin) {
    console.log("ℹ️  Admin already exists — skipping");
  } else {
    const admin = new User({
      name: "RHG Admin",
      email: "admin@rhgcs.in",
      mobile: "9000000000",
      password: ADMIN_PASSWORD,
      role: "admin",
      isVerified: true,
      isActive: true,
    });
    await admin.save();
    console.log("✅ Admin created!");
    console.log(`   📧 Email   : admin@rhgcs.in`);
    console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
  }

  // ── Seed Demo Student ───────────────────────────────────────
  console.log("\n🎓 Creating demo student...");
  const existingStudent = await User.findOne({ email: "student@rhgcs.in" });

  if (existingStudent) {
    console.log("ℹ️  Demo student already exists — skipping");
  } else {
    const student = new User({
      name: "Demo Student",
      email: "student@rhgcs.in",
      mobile: "9000000001",
      password: "Student@123!",
      role: "student",
      isVerified: true,
      isActive: true,
    });
    await student.save();
    console.log("✅ Demo student created!");
    console.log(`   📧 Email   : student@rhgcs.in`);
    console.log(`   🔑 Password: Student@123!`);
  }

  console.log("\n" + "=".repeat(45));
  console.log("✅ Seeding complete!");
  console.log("\n🚀 You can now start the app with: npm run dev");
  console.log("=".repeat(45) + "\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err.message);
  process.exit(1);
});
