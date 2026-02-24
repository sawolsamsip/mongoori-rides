import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import Invoice from "../models/Invoice.js";
import { sendBookingCancellation } from "../services/emailService.js";

function startOfDay(dateStr) {
    const d = new Date(dateStr);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}
function endOfDay(dateStr) {
    const d = new Date(dateStr);
    d.setUTCHours(23, 59, 59, 999);
    return d;
}

// Function to Check Availability of Car for a given Date (excludes cancelled, same date logic as payment)
const checkAvailability = async (car, pickupDate, returnDate)=>{
    const reqPickupStart = startOfDay(pickupDate);
    const reqReturnEnd = endOfDay(returnDate);
    const bookings = await Booking.find({
        car,
        status: { $ne: "cancelled" },
        $and: [
            { pickupDate: { $lt: reqReturnEnd } },
            { returnDate: { $gt: reqPickupStart } },
        ],
    });
    return bookings.length === 0;
}

// API: check if one car is available for given dates (no auth – for CarDetails UI)
export const checkCarAvailabilityForDates = async (req, res) => {
    try {
        const { carId, pickup, return: returnDate } = req.query;
        if (!carId || !pickup || !returnDate) {
            return res.json({ success: false, available: false, message: "Missing carId, pickup, or return" });
        }
        const available = await checkAvailability(carId, pickup, returnDate);
        res.json({ success: true, available });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, available: false, message: error.message });
    }
};

// API to Check Availability of Cars for the given Date and location
export const checkAvailabilityOfCar = async (req, res)=>{
    try {
        const {location, pickupDate, returnDate} = req.body

        // fetch all available cars for the given location
        const cars = await Car.find({location, isAvaliable: true})

        // check car availability for the given date range using promise
        const availableCarsPromises = cars.map(async (car)=>{
           const isAvailable = await checkAvailability(car._id, pickupDate, returnDate)
           return {...car._doc, isAvailable: isAvailable}
        })

        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true)

        res.json({success: true, availableCars})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to Create Booking
export const createBooking = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {car, pickupDate, returnDate} = req.body;

        const isAvailable = await checkAvailability(car, pickupDate, returnDate)
        if(!isAvailable){
            return res.json({success: false, message: "Car is not available"})
        }

        const carData = await Car.findById(car)

        // Calculate price based on pickupDate and returnDate
        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24))
        const price = carData.pricePerDay * noOfDays;

        await Booking.create({car, owner: carData.owner, user: _id, pickupDate, returnDate, price})

        res.json({success: true, message: "Booking Created"})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to List User Bookings 
export const getUserBookings = async (req, res)=>{
    try {
        const {_id} = req.user;
        const bookings = await Booking.find({ user: _id }).populate("car").sort({createdAt: -1})
        res.json({success: true, bookings})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to get Owner Bookings

export const getOwnerBookings = async (req, res)=>{
    try {
        if(req.user.role !== 'owner'){
            return res.json({ success: false, message: "Unauthorized" })
        }
        const bookings = await Booking.find({owner: req.user._id}).populate('car user').select("-user.password").sort({createdAt: -1 })
        res.json({success: true, bookings})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to change booking status
export const changeBookingStatus = async (req, res)=>{
    try {
        const {_id} = req.user;
        const {bookingId, status} = req.body

        const booking = await Booking.findById(bookingId)

        if(booking.owner.toString() !== _id.toString()){
            return res.json({ success: false, message: "Unauthorized"})
        }

        booking.status = status;
        if (status === "cancelled") {
            booking.cancelledAt = new Date();
            const inv = await Invoice.findOne({ booking: bookingId });
            if (inv) {
                inv.status = "cancelled";
                inv.cancelledAt = new Date();
                await inv.save();
            }
        }
        await booking.save();

        if (status === "cancelled") {
            const bookingWithCar = await Booking.findById(bookingId).populate("car");
            if (bookingWithCar) await sendBookingCancellation(bookingWithCar, bookingWithCar.car);
        }

        res.json({ success: true, message: "Status Updated"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// API to cancel booking (user cancels own, or owner cancels)
export const cancelBooking = async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.json({ success: false, message: "Booking not found" });

        const isOwner = role === "owner" && booking.owner.toString() === userId.toString();
        const isUser = booking.user.toString() === userId.toString();
        if (!isOwner && !isUser) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        if (booking.status === "cancelled") {
            return res.json({ success: true, message: "Already cancelled" });
        }

        booking.status = "cancelled";
        booking.cancelledAt = new Date();
        await booking.save();

        const inv = await Invoice.findOne({ booking: bookingId });
        if (inv) {
            inv.status = "cancelled";
            inv.cancelledAt = new Date();
            await inv.save();
        }

        const bookingWithCar = await Booking.findById(bookingId).populate("car");
        if (bookingWithCar) await sendBookingCancellation(bookingWithCar, bookingWithCar.car);

        res.json({ success: true, message: "Booking cancelled" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// API to delete booking (owner only – remove from list)
export const deleteBooking = async (req, res) => {
    try {
        if (req.user.role !== "owner") {
            return res.json({ success: false, message: "Unauthorized" });
        }
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.json({ success: false, message: "Booking not found" });
        if (booking.owner.toString() !== req.user._id.toString()) {
            return res.json({ success: false, message: "Unauthorized" });
        }
        const inv = await Invoice.findOne({ booking: bookingId });
        if (inv) {
            inv.status = "cancelled";
            inv.cancelledAt = new Date();
            await inv.save();
        }
        await Booking.findByIdAndDelete(bookingId);
        res.json({ success: true, message: "Booking deleted" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}