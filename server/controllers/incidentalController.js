import Incidental from "../models/Incidental.js";
import Booking from "../models/Booking.js";

export const createIncidental = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { bookingId, type, title, description, reporter } = req.body;

    const booking = await Booking.findById(bookingId).populate("user owner");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const isDriver = booking.user._id.toString() === userId.toString();
    const isOwner = role === "owner" && booking.owner._id.toString() === userId.toString();
    if (!isDriver && !isOwner) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const reporterValue = isDriver ? "driver" : isOwner ? "owner" : (reporter || "driver");
    const incidental = await Incidental.create({
      booking: bookingId,
      type: type || "accident",
      title: title || "Incident report",
      description,
      reporter: reporterValue,
      reportedBy: userId,
      status: "reported",
    });

    res.status(201).json({ success: true, incidental });
  } catch (err) {
    console.error("createIncidental", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addStatement = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const { incidentalId, statement } = req.body;

    const incidental = await Incidental.findById(incidentalId).populate("booking");
    if (!incidental) return res.status(404).json({ success: false, message: "Incidental not found" });

    const booking = await Booking.findById(incidental.booking._id);
    const isDriver = booking.user.toString() === userId.toString();
    const isOwner = role === "owner" && booking.owner.toString() === userId.toString();
    if (!isDriver && !isOwner) return res.status(403).json({ success: false, message: "Unauthorized" });

    if (isDriver) incidental.driverStatement = statement;
    else incidental.ownerStatement = statement;
    incidental.status = "gathering_info";
    await incidental.save();

    res.json({ success: true, incidental });
  } catch (err) {
    console.error("addStatement", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;
    const role = req.user.role;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    const isDriver = booking.user.toString() === userId.toString();
    const isOwner = role === "owner" && booking.owner.toString() === userId.toString();
    if (!isDriver && !isOwner) return res.status(403).json({ success: false, message: "Unauthorized" });

    const list = await Incidental.find({ booking: bookingId }).sort({ createdAt: -1 });
    res.json({ success: true, incidentals: list });
  } catch (err) {
    console.error("listByBooking", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listForOwner = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const bookings = await Booking.find({ owner: req.user._id }).select("_id");
    const bookingIds = bookings.map((b) => b._id);
    const incidentals = await Incidental.find({ booking: { $in: bookingIds } })
      .populate({ path: "booking", populate: ["car", "user"] })
      .sort({ createdAt: -1 });
    res.json({ success: true, incidentals });
  } catch (err) {
    console.error("listForOwner", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const { incidentalId, status, resolutionNotes } = req.body;
    const incidental = await Incidental.findById(incidentalId);
    if (!incidental) return res.status(404).json({ success: false, message: "Incidental not found" });

    const booking = await Booking.findById(incidental.booking);
    if (booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    incidental.status = status;
    if (resolutionNotes) incidental.resolutionNotes = resolutionNotes;
    if (status === "resolved") {
      incidental.resolvedAt = new Date();
      incidental.resolvedBy = req.user._id;
    }
    await incidental.save();
    res.json({ success: true, incidental });
  } catch (err) {
    console.error("updateStatus", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
