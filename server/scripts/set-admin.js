/**
 * Set a user's role to admin (operator) by email.
 * Run from server folder: ADMIN_EMAIL=contact@mongoori.com node scripts/set-admin.js
 */
import "dotenv/config";
import connectDB from "../configs/db.js";
import User from "../models/User.js";

const email = process.env.ADMIN_EMAIL;
if (!email) {
    console.error("Set ADMIN_EMAIL=your@email.com");
    process.exit(1);
}

async function setAdmin() {
    await connectDB();
    const user = await User.findOneAndUpdate(
        { email: email.trim() },
        { role: "admin" },
        { new: true }
    ).select("email name role");
    if (!user) {
        console.error("User not found for email:", email);
        process.exit(1);
    }
    console.log("Updated to admin:", user.email, user.name, "→ role:", user.role);
    process.exit(0);
}

setAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
});
