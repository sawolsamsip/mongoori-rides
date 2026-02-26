import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true },
    password: {type: String, required: true },
    role: { type: String, enum: ["user", "owner", "admin"], default: "user" },
    image: {type: String, default: ''},
    // Tesla Fleet API OAuth (per-owner)
    teslaAccessToken: { type: String },
    teslaRefreshToken: { type: String },
    teslaTokenExpiresAt: { type: Date },
},{timestamps: true})

const User = mongoose.model('User', userSchema)

export default User