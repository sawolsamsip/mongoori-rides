/**
 * Print current role for a user by email.
 * Run from server folder: node scripts/show-user-role.js contact@mongoori.com
 * Or: CHECK_EMAIL=contact@mongoori.com node scripts/show-user-role.js
 */
import "dotenv/config";
import connectDB from "../configs/db.js";
import User from "../models/User.js";

const email = process.env.CHECK_EMAIL || process.argv[2];
if (!email) {
    console.error("Usage: node scripts/show-user-role.js <email>");
    console.error("Or: CHECK_EMAIL=contact@mongoori.com node scripts/show-user-role.js");
    process.exit(1);
}

async function show() {
    await connectDB();
    const user = await User.findOne({ email: email.trim() }).select("email name role").lean();
    if (!user) {
        console.error("User not found:", email);
        process.exit(1);
    }
    console.log("Email:", user.email);
    console.log("Name:", user.name);
    console.log("Role:", user.role);
    process.exit(0);
}

show().catch((err) => {
    console.error(err);
    process.exit(1);
});
