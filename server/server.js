import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";

// Initialize Express App
const app = express();

// 🚨 1. CORS 보안 설정 (로컬 주소 + 나중에 배포할 프론트엔드 주소만 허용)
// .env 파일에 FRONTEND_URL을 추가하게 됩니다.
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'];
app.use(cors({
    origin: function (origin, callback) {
        // origin이 없거나(서버 간 통신 등) 허용된 주소일 경우 통과
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => res.send("mongoori rides API is running 🚀"))
app.use('/api/user', userRouter)
app.use('/api/owner', ownerRouter)
app.use('/api/bookings', bookingRouter)

const PORT = process.env.PORT || 3000;

// 🚨 2. DB가 먼저 완벽히 연결된 후 서버(포트)를 열도록 수정
connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}).catch((err) => {
    console.error("Server failed to start due to DB connection error.", err);
});
