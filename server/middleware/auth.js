import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next)=>{
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({success: false, message: "not authorized"})
    }
    try {
        const payload = jwt.decode(token);
        if (!payload) {
            return res.status(401).json({ success: false, message: "not authorized" });
        }
        const userId = typeof payload === "string" ? payload : (payload.id ?? payload.sub ?? payload._id);
        if (!userId) {
            return res.status(401).json({ success: false, message: "not authorized" });
        }
        req.user = await User.findById(userId).select("-password");
        if (!req.user) {
            return res.status(401).json({ success: false, message: "not authorized" });
        }
        next();
    } catch (error) {
        console.error("Auth error:", error.message);
        return res.status(401).json({ success: false, message: "not authorized" });
    }
}

export const requireAdmin = async (req, res, next) => {
    if (!req.user) return res.json({ success: false, message: "not authorized" });
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
    next();
};