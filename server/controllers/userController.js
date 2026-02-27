import User from "../models/User.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import Car from "../models/Car.js";


// Generate JWT Token
const generateToken = (userId)=>{
    const payload = userId;
    return jwt.sign(payload, process.env.JWT_SECRET)
}

// Register User (role: 'user' = driver/renter, 'owner' = car host)
export const registerUser = async (req, res)=>{
    try {
        const { name, email, password, role: requestedRole } = req.body

        if(!name || !email || !password || password.length < 8){
            return res.json({success: false, message: 'Fill all the fields'})
        }

        const role = requestedRole === 'owner' ? 'owner' : 'user'
        const userExists = await User.findOne({email})
        if(userExists){
            return res.json({success: false, message: 'User already exists'})
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({ name, email, password: hashedPassword, role })
        const token = generateToken(user._id.toString())
        const safeUser = { _id: user._id, name: user.name, email: user.email, role: user.role, image: user.image }
        res.json({ success: true, token, user: safeUser })
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Login User 
export const loginUser = async (req, res)=>{
    try {
        const {email, password} = req.body
        const user = await User.findOne({email})
        if(!user){
            return res.json({success: false, message: "User not found" })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            return res.json({success: false, message: "Invalid Credentials" })
        }
        const token = generateToken(user._id.toString())
        const safeUser = { _id: user._id, name: user.name, email: user.email, role: user.role, image: user.image }
        res.json({ success: true, token, user: safeUser })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get User data using Token (JWT). Always fresh from DB so role changes (e.g. set-admin) show up.
export const getUserData = async (req, res) =>{
    try {
        const { user } = req;
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.json({ success: true, user })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get All Cars for the Frontend. Only isAvaliable: true (Visible on fleet). Hidden cars never returned here.
// Also adds hasActiveBooking so UI can show Booked vs Available.
export const getCars = async (req, res) =>{
    try {
        const cars = await Car.find({ isAvaliable: true }).lean();
        const Booking = (await import("../models/Booking.js")).default;
        const now = new Date();
        const withAvailability = await Promise.all(
            cars.map(async (car) => {
                const hasActiveBooking = await Booking.findOne({
                    car: car._id,
                    status: { $ne: "cancelled" },
                    returnDate: { $gte: now },
                });
                return { ...car, hasActiveBooking: !!hasActiveBooking };
            })
        );
        res.set("Cache-Control", "no-store, no-cache, must-revalidate");
        res.json({ success: true, cars: withAvailability });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}