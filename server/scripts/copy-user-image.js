/**
 * Copy profile image from one user (by email) to another.
 * Run from server folder: SOURCE_EMAIL=from@email.com TARGET_EMAIL=to@email.com node scripts/copy-user-image.js
 */
import "dotenv/config";
import connectDB from "../configs/db.js";
import User from "../models/User.js";

const sourceEmail = process.env.SOURCE_EMAIL;
const targetEmail = process.env.TARGET_EMAIL;
if (!sourceEmail || !targetEmail) {
    console.error("Set SOURCE_EMAIL=from@email.com and TARGET_EMAIL=to@email.com");
    process.exit(1);
}

async function copy() {
    await connectDB();
    const source = await User.findOne({ email: sourceEmail.trim() }).select("email image").lean();
    const target = await User.findOne({ email: targetEmail.trim() }).select("email image").lean();
    if (!source) {
        console.error("Source user not found:", sourceEmail);
        process.exit(1);
    }
    if (!target) {
        console.error("Target user not found:", targetEmail);
        process.exit(1);
    }
    const imageUrl = source.image || "";
    if (!imageUrl) {
        console.error("Source user has no profile image.");
        process.exit(1);
    }
    await User.findByIdAndUpdate(target._id, { image: imageUrl });
    console.log("Copied profile image from", sourceEmail, "to", targetEmail);
    process.exit(0);
}

copy().catch((err) => {
    console.error(err);
    process.exit(1);
});
