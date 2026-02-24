import mongoose from "mongoose";
const {ObjectId} = mongoose.Schema.Types

const carSchema = new mongoose.Schema({
    owner: {type: ObjectId, ref: 'User'},
    brand: {type: String, required: true, default: 'Tesla'}, // 테슬라로 기본값 설정
    model: {type: String, required: true},
    image: {type: String, required: true},
    year: {type: Number, required: true},
    category: {type: String, required: true},
    seating_capacity: {type: Number, required: true},
    
    //  Tesla 특화 필드로 교체
    autopilot: { type: String, default: 'Basic' }, 
    battery_range: { type: Number, required: true },

    pricePerDay: { type: Number, required: true },
    pricePerWeek: { type: Number }, // Weekly 메인: 저장값 그대로 표시 (750 입력 시 750으로 표시)
    location: { type: String, required: true },
    description: { type: String, required: true },
    isAvaliable: {type: Boolean, default: true},
    teslaVehicleId: { type: String },
},{timestamps: true})

const Car = mongoose.model('Car', carSchema)

export default Car
