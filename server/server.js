import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";
import userRouter from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import invoiceRouter from "./routes/invoiceRoutes.js";
import incidentalRouter from "./routes/incidentalRoutes.js";
import teslaRouter from "./routes/teslaRoutes.js";

// Initialize Express App
const app = express();

// 🚨 1. CORS 보안 설정
// - FRONTEND_URL: 기본 프론트엔드 URL (예: http://localhost:5173 또는 http://192.168.1.188:5173)
// - 필요하면 쉼표로 여러 개도 허용: FRONTEND_URLS=http://localhost:5173,http://192.168.1.188:5173
const envOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(o => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://192.168.1.188:5173',
  ...envOrigins,
].filter(Boolean);
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

// Stripe webhook must receive raw body for signature verification (before express.json())
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => res.send("mongoori rides API is running 🚀"))
app.use('/api/user', userRouter)
app.use('/api/owner', ownerRouter)
app.use('/api/bookings', bookingRouter)
app.use('/api/payment', paymentRouter)
app.use('/api/invoices', invoiceRouter)
app.use('/api/incidentals', incidentalRouter)
app.use('/api/tesla', teslaRouter)

const PORT = process.env.PORT || 3000;

// 🚨 2. DB가 먼저 완벽히 연결된 후 서버(포트)를 열도록 수정
connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}).catch((err) => {
    console.error("Server failed to start due to DB connection error.", err);
});
