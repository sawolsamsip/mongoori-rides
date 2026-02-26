import imagekit from "../configs/imageKit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import fs from "fs";
import * as teslaFleetService from "../services/teslaFleetService.js";


// API to Change Role of User
export const changeRoleToOwner = async (req, res)=>{
    try {
        const {_id} = req.user;
        await User.findByIdAndUpdate(_id, {role: "owner"})
        res.json({success: true, message: "Now you can list cars"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to List Car

export const addCar = async (req, res)=>{
    try {
        const {_id} = req.user;
        let car = JSON.parse(req.body.carData);
        const imageFile = req.file;

        // Upload Image to ImageKit
        const fileBuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: '/cars'
        })

        // optimization through imagekit URL transformation
        var optimizedImageUrl = imagekit.url({
            path : response.filePath,
            transformation : [
                {width: '1280'}, // Width resizing
                {quality: 'auto'}, // Auto compression
                { format: 'webp' }  // Convert to modern format
            ]
        });

        const image = optimizedImageUrl;
        await Car.create({...car, owner: _id, image})

        res.json({success: true, message: "Car Added"})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to List Owner Cars
export const getOwnerCars = async (req, res)=>{
    try {
        const {_id} = req.user;
        const cars = await Car.find({owner: _id })
        res.json({success: true, cars})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to Toggle Car Availability
export const toggleCarAvailability = async (req, res) =>{
    try {
        const {_id} = req.user;
        const {carId} = req.body
        const car = await Car.findById(carId)

        // Checking is car belongs to the user
        if(car.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized" });
        }

        car.isAvaliable = !car.isAvaliable;
        await car.save()

        res.json({success: true, message: "Availability Toggled"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to update car price (Weekly 메인: 주간 가격 입력 시 일일 가격 자동 계산 = weekly/7*1.2)
export const updateCarPrice = async (req, res) => {
    try {
        const { _id } = req.user;
        const { carId, weeklyPrice } = req.body;
        const car = await Car.findById(carId);
        if (!car) return res.json({ success: false, message: "Car not found" });
        if (car.owner.toString() !== _id.toString()) return res.json({ success: false, message: "Unauthorized" });
        const weekly = Number(weeklyPrice);
        if (!Number.isFinite(weekly) || weekly <= 0) return res.json({ success: false, message: "Invalid weekly price" });
        car.pricePerWeek = Math.round(weekly * 100) / 100; // 입력한 주간 가격 그대로 저장 (750 → 750)
        car.pricePerDay = Math.round((weekly / 7) * 1.2 * 100) / 100; // 일일은 20% 프리미엄 기준 계산
        await car.save();
        res.json({ success: true, message: "Price updated", car: { pricePerDay: car.pricePerDay, pricePerWeek: car.pricePerWeek } });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

/** Default image URL when creating a car from Tesla (no upload). Owner can change in Manage Cars. */
const DEFAULT_CAR_IMAGE = process.env.DEFAULT_CAR_IMAGE || "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800";

/** Decode model year from VIN (10th character, position index 9). Standard NHTSA: 1980–2039. */
function yearFromVin(vin) {
    if (!vin || typeof vin !== "string" || vin.length < 10) return null;
    const char = vin.charAt(9).toUpperCase();
    const map = { A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017, J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025, T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030, 1: 2001, 2: 2002, 3: 2003, 4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009 };
    return map[char] ?? null;
}

/** Derive Tesla model line '3' | 'Y' from API/VIN for display and image. */
function teslaModelTypeFromData(data) {
    const raw = [
        data.vehicle_config?.car_type,
        data.vehicle_config?.trim_badging,
        data.display_name,
    ].filter(Boolean).join(" ").toLowerCase();
    if (raw.includes("model y") || raw.includes("modely") || raw.includes("model_y")) return "Y";
    if (raw.includes("model 3") || raw.includes("model3") || raw.includes("model_3")) return "3";
    if (raw.includes("y ")) return "Y";
    return "3";
}

/** Build Car fields from Tesla vehicle API response (display_name, vin, vehicle_config, etc.). */
function mapTeslaVehicleToCarFields(data, fallbackYear) {
    const vin = data.vin || "";
    const year = yearFromVin(vin) ?? data.year ?? fallbackYear;
    const displayName = data.display_name || "";
    const carType = (data.vehicle_config && (data.vehicle_config.car_type || data.vehicle_config.trim_badging)) || "";
    const model = [displayName, carType].filter(Boolean).join(" ") || (vin ? `Tesla •${vin.slice(-4)}` : "Tesla");
    const trim = (data.vehicle_config && data.vehicle_config.trim_badging) || "";
    const category = (carType.toLowerCase().includes("suv") || (trim && trim.toLowerCase().includes("y"))) ? "SUV" : "Sedan";
    let seating = 5;
    if (data.vehicle_config?.seating && typeof data.vehicle_config.seating.front === "number" && typeof data.vehicle_config.seating.rear === "number") {
        seating = data.vehicle_config.seating.front + data.vehicle_config.seating.rear;
    }
    const range = data.vehicle_config?.battery_range ?? data.vehicle_state?.est_battery_range ?? 300;
    const teslaModelType = teslaModelTypeFromData(data);
    const description = trim ? `${trim}. Electric.` : "Electric.";
    return {
        model: model.trim() || "Tesla",
        year: Number(year) || fallbackYear,
        category,
        seating_capacity: Number(seating) || 5,
        battery_range: Number(range) || 300,
        description,
        trim: trim || undefined,
        teslaModelType,
    };
}

/** Register selected Tesla vehicles as Mongoori fleet listings. Body: { teslaVehicleIds: string[] }
 * Only owner vehicles are allowed (driver/shared vehicles are skipped).
 * Year/specs are derived from Tesla API and VIN where possible.
 */
export const addCarsFromTesla = async (req, res) => {
    try {
        const _id = req.user._id;
        const { teslaVehicleIds } = req.body;
        if (!Array.isArray(teslaVehicleIds) || teslaVehicleIds.length === 0) {
            return res.json({ success: false, message: "teslaVehicleIds array required" });
        }
        const userToken = req.user.teslaAccessToken || null;
        const created = [];
        let skippedDriver = 0;
        const fallbackYear = new Date().getFullYear();
        for (const vid of teslaVehicleIds) {
            const vehicleRes = await teslaFleetService.getVehicle(vid, userToken);
            const data = vehicleRes.ok && vehicleRes.data ? vehicleRes.data : null;
            const vin = data ? data.vin : null;

            if (vin) {
                const isOwner = await teslaFleetService.isOwnerVehicle(vin, userToken);
                if (!isOwner) {
                    skippedDriver += 1;
                    continue;
                }
            }

            const existing = await Car.findOne({ owner: _id, teslaVehicleId: vid });
            if (existing) continue;

            const fields = data ? mapTeslaVehicleToCarFields(data, fallbackYear) : {
                model: `Tesla ${String(vid).slice(-6)}`,
                year: fallbackYear,
                category: "Sedan",
                seating_capacity: 5,
                battery_range: 300,
                description: "Electric.",
                trim: undefined,
                teslaModelType: "3",
            };

            const car = await Car.create({
                owner: _id,
                brand: "Tesla",
                image: DEFAULT_CAR_IMAGE,
                pricePerDay: 0,
                location: "Irvine, CA",
                isAvaliable: false,
                teslaVehicleId: vid,
                ...fields,
            });
            created.push({ _id: car._id, model: car.model, teslaVehicleId: vid });
        }
        const baseMsg = `${created.length} vehicle(s) added to fleet`;
        const message = skippedDriver
            ? `${baseMsg}. ${skippedDriver} vehicle(s) were driver/shared vehicles and were not added.`
            : baseMsg;
        return res.json({ success: true, message, created });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};

// Link a Mongoori car to a Tesla Fleet vehicle (for charging/telemetry).
export const linkCarToTesla = async (req, res) => {
    try {
        const _id = req.user._id.toString();
        const { carId, teslaVehicleId } = req.body;
        if (!carId) return res.json({ success: false, message: "carId required" });
        const car = await Car.findById(carId);
        if (!car) return res.json({ success: false, message: "Car not found" });
        if (car.owner.toString() !== _id) return res.json({ success: false, message: "Unauthorized" });
        car.teslaVehicleId = teslaVehicleId || null; // empty string clears link
        await car.save();
        return res.json({ success: true, message: teslaVehicleId ? "Tesla vehicle linked" : "Tesla link removed", car: { _id: car._id, teslaVehicleId: car.teslaVehicleId } });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};

// Api to delete a car
export const deleteCar = async (req, res) =>{
    try {
        const {_id} = req.user;
        const {carId} = req.body
        const car = await Car.findById(carId)

        // Checking is car belongs to the user
        if(car.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized" });
        }

        car.owner = null;
        car.isAvaliable = false;
        car.teslaVehicleId = null; // clear Tesla link so vehicle can be re-added later

        await car.save()

        res.json({success: true, message: "Car Removed"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to get Dashboard Data
export const getDashboardData = async (req, res) =>{
    try {
        const { _id, role } = req.user;

        if(role !== 'owner'){
            return res.json({ success: false, message: "Unauthorized" });
        }

        const cars = await Car.find({owner: _id})
        const bookings = await Booking.find({ owner: _id }).populate('car').sort({ createdAt: -1 });

        const pendingBookings = await Booking.find({owner: _id, status: "pending" })
        const completedBookings = await Booking.find({owner: _id, status: "confirmed" })

        // Calculate monthlyRevenue from bookings where status is confirmed
        const monthlyRevenue = bookings.slice().filter(booking => booking.status === 'confirmed').reduce((acc, booking)=> acc + booking.price, 0)

        const dashboardData = {
            totalCars: cars.length,
            totalBookings: bookings.length,
            pendingBookings: pendingBookings.length,
            completedBookings: completedBookings.length,
            recentBookings: bookings.slice(0,3),
            monthlyRevenue
        }

        res.json({ success: true, dashboardData });

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to update user image

export const updateUserImage = async (req, res)=>{
    try {
        const { _id } = req.user;

        const imageFile = req.file;

        // Upload Image to ImageKit
        const fileBuffer = fs.readFileSync(imageFile.path)
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: '/users'
        })

        // optimization through imagekit URL transformation
        var optimizedImageUrl = imagekit.url({
            path : response.filePath,
            transformation : [
                {width: '400'}, // Width resizing
                {quality: 'auto'}, // Auto compression
                { format: 'webp' }  // Convert to modern format
            ]
        });

        const image = optimizedImageUrl;

        await User.findByIdAndUpdate(_id, {image});
        res.json({success: true, message: "Image Updated" })

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}   