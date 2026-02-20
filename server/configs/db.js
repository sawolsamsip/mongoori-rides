import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected Successfully 🚀"));
        mongoose.connection.on('error', (err) => console.log("Database Connection Error: ", err));

        // .env 파일에 MONGODB_URI가 빠져있을 경우를 대비한 방어 코드
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing in .env file.");
        }

        await mongoose.connect(`${process.env.MONGODB_URI}/car-rental`);
    } catch (error) {
        console.error("MongoDB Connection Failed: ", error.message);
        process.exit(1); // 연결 실패 시 프로세스를 강제 종료하여 서버가 좀비 상태가 되는 것을 막습니다.
    }
}

export default connectDB;
