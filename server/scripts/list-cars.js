/**
 * List all cars in DB with owner info (to find old/duplicate data).
 * Run from server folder: node scripts/list-cars.js
 */
import "dotenv/config";
import connectDB from "../configs/db.js";
import Car from "../models/Car.js";
import User from "../models/User.js";

async function list() {
    await connectDB();
    const cars = await Car.find({}).lean().sort({ createdAt: -1 });
    console.log("Total cars in DB:", cars.length);
    for (const c of cars) {
        const owner = c.owner ? await User.findById(c.owner).select("email name").lean() : null;
        console.log({
            _id: c._id,
            model: c.model,
            isAvaliable: c.isAvaliable,
            owner: owner ? `${owner.email} (${owner.name})` : "NO OWNER",
            teslaVehicleId: c.teslaVehicleId || "-",
        });
    }
    process.exit(0);
}

list().catch((err) => {
    console.error(err);
    process.exit(1);
});
