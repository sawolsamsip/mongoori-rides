# Car Rental Booking System (MERN Stack)

A fully functional, production‑ready **Car Rental Booking Website** built using the **MERN Stack (MongoDB, Express.js, React.js, Node.js)** with **ImageKit** integration for media storage.

---

## 🚀 Features

### 👤 **User Features**

* User Registration & Login (JWT‑based authentication)
* Browse cars with filters
* Select pickup location & date
* View car details
* Make a booking
* View "My Bookings" page

### 🛠️ **Admin Features**

* Secure Admin Login
* Add new cars
* Manage all bookings
* Manage car inventory including images

### 🖼️ **Image Handling**

* Image upload handled via **ImageKit**
* Auto optimization, fast delivery

### 🌐 **Fully Deployed Application**

* Frontend deployed (e.g., on Vercel or Netlify)
* Backend deployed (e.g., on Render or Railway)
* Connected to MongoDB Atlas

---

## 🏗️ Tech Stack

### **Frontend**

* React.js
* React Router
* Axios
* Context API
* CSS / Tailwind (optional)

### **Backend**

* Node.js
* Express.js
* MongoDB & Mongoose
* JWT Authentication
* ImageKit SDK

### **Deployment**

* Frontend → Vercel / Netlify
* Backend → Render / Railway / VPS
* Database → MongoDB Atlas
* Media → ImageKit

---

## 📁 Folder Structure

```
car-rental-app/
│
├── client/             # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── assets/
│   │   ├── App.js
│   │   ├── index.js
│   └── package.json
│
├── server/             # Node Backend
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── .env
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 🔧 Prerequisites

Make sure you have:

* Node.js installed
* MongoDB Atlas account
* ImageKit account

---

## 🖥️ Local Setup

### **1. Clone the Repository**

```bash
https://github.com/PratikDevelops/CarRental-fullstack.git
cd CarRental-fullstack
```

### **2. Install Frontend Dependencies**

```bash
cd client
npm install
```

### **3. Install Backend Dependencies**

```bash
cd ../server
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file in the **server** folder and add:

```
MONGO_URI=your_mongo_atlas_url
JWT_SECRET=your_jwt_secret
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

---

## ▶️ Run the App

**404 방지:** 백엔드를 먼저 실행한 뒤 프론트를 띄우고, `client/.env`에 `VITE_BASE_URL`을 **비워두면** Vite가 `/api` 요청을 백엔드로 프록시합니다.

### **1. Start Backend**

```bash
cd server
cp .env.example .env   # 필요 시 편집
npm run server
```

백엔드: [http://localhost:3000](http://localhost:3000)

### **2. Start Frontend**

```bash
cd client
npm run dev
```

프론트: [http://localhost:5173](http://localhost:5173)

### **3. Stripe 결제 테스트 (결제 창이 뜨게 하려면)**

결제 창이 안 뜨면 대부분 **백엔드가 떠 있지 않거나** `/api` 요청이 백엔드로 가지 않는 경우입니다.

1. **백엔드 먼저 실행** (위 1번), **프론트는 `VITE_BASE_URL` 비우고** 실행 (위 2번).
2. 서버 `.env`에 테스트 키 설정:
   * `STRIPE_SECRET_KEY=sk_test_...` ([Stripe Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys))
   * `FRONTEND_URL=http://localhost:5173`
3. **로컬에서 Stripe 웹훅 받으려면** (결제 완료 후 예약 자동 생성용) 터미널 하나 더 열어서:
   ```bash
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```
   실행 후 나오는 **Signing secret** (`whsec_...`)을 복사해 서버 `.env`에 넣기:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   (이걸 해두면 결제 완료 시 웹훅으로 예약이 생성됨. CLI 안 켜도 결제 창은 뜨고, 결제 후 리다이렉트 페이지에서 확인 버튼으로 예약 생성 가능.)
4. 결제 테스트 카드: **4242 4242 4242 4242**, 만료일 미래 아무 날, CVC 아무 3자리.

---

## 📦 Build for Production

### Frontend Build

```bash
cd client
npm run build
```

This generates a production-ready build inside `/dist`.

---

## ☁️ Deployment Steps

### **Frontend (Vercel / Netlify)**

1. Connect GitHub repo
2. Select the `client` folder
3. Build Command → `npm run build`
4. Output Directory → `dist`

### **Backend (Render / Railway)**

1. Create new web service
2. Use `server` folder
3. Add environment variables
4. Deploy

### **ImageKit Setup**

* Create a new ImageKit project
* Copy API Keys to `.env`
* Use `.upload()` method to upload car images

---

## 🔗 API Endpoints

### **Auth Routes**

| Method | Endpoint           | Description   |
| ------ | ------------------ | ------------- |
| POST   | /api/auth/register | Register user |
| POST   | /api/auth/login    | Login user    |

### **Car Routes**

| Method | Endpoint      | Description     |
| ------ | ------------- | --------------- |
| GET    | /api/cars     | List all cars   |
| GET    | /api/cars/:id | Get car details |
| POST   | /api/cars     | Add car (Admin) |

### **Booking Routes**

| Method | Endpoint         | Description       |
| ------ | ---------------- | ----------------- |
| POST   | /api/bookings    | Create booking    |
| GET    | /api/bookings/me | Get user bookings |

---



---

## 🛡️ Authentication Flow

* User logs in → Backend generates JWT
* Frontend stores token in localStorage
* Token added in every protected request header
* Admin routes are protected using middleware

---

## ✨ Bonus Features You Can Add

* Payment gateway (Razorpay / Stripe)
* Advanced car filters (price, brand, fuel type)
* Reviews & ratings
* Coupon/discount system
* Admin analytics dashboard
* OTP login

---


## 📄 License

This project is open source and free to use.

---

## 💬 Feedback & Support

Feel free to fork the project, raise issues, or suggest improvements!
