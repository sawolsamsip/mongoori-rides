import express from "express";
import { changeBookingStatus, checkAvailabilityOfCar, checkCarAvailabilityForDates, createBooking, getOwnerBookings, getUserBookings, cancelBooking, deleteBooking } from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const bookingRouter = express.Router();

bookingRouter.get('/check-dates', checkCarAvailabilityForDates)
bookingRouter.post('/check-availability', checkAvailabilityOfCar)
bookingRouter.post('/create', protect, createBooking)
bookingRouter.get('/user', protect, getUserBookings)
bookingRouter.get('/owner', protect, getOwnerBookings)
bookingRouter.post('/change-status', protect, changeBookingStatus)
bookingRouter.post('/cancel', protect, cancelBooking)
bookingRouter.post('/delete', protect, deleteBooking)

export default bookingRouter;