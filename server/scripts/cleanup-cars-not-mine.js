/**
 * Delete cars that do NOT belong to the given owner email (removes old/test data).
 * Run from server folder: OWNER_EMAIL=your@email.com node scripts/cleanup-cars-not-mine.js
 * Use list-cars.js first to see which cars exist and who owns them.
 */
import "dotenv/config";
import connectDB from "../configs/db.js";
import Car from "../models/Car.js";
import User from "../models/User.js";

const ownerEmail = process.env.OWNER_EMAIL;
if (!ownerEmail) {
    console.error("Set OWNER_EMAIL=your@email.com");
    process.exit(1);
}

async function cleanup() {
    await connectDB();
    const me = await User.findOne({ email: ownerEmail.trim() }).select("_id email name");
    if (!me) {
        console.error("User not found for email:", ownerEmail);
        process.exit(1);
    }
    const myId = me._id.toString();
    const deleted = await Car.deleteMany({ owner: { $ne: myId } });
    console.log("Deleted cars not owned by", ownerEmail, ":", deleted.deletedCount);
    const remaining = await Car.countDocuments({ owner: myId });
    console.log("Your cars remaining:", remaining);
    process.exit(0);
}

cleanup().catch((err) => {
    console.error(err);
    process.exit(1);
});
