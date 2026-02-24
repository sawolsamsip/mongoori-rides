# Mongoori Rides

Premium Tesla rental platform (Irvine, CA) built with **MERN Stack** (MongoDB, Express, React, Node.js). Stripe payments, PDF invoices, optional email notifications, and owner dashboard.

---

## Features

### User
- Auth (JWT), browse fleet, car details with weekly/daily pricing
- Pickup fixed to **today (PST)**; select return date or number of weeks
- **Stripe Checkout** → booking success → My Trips
- **My Trips**: view bookings, download invoice (PDF), cancel, report incident
- Profile image (ImageKit); updates without logging out; shown in Navbar

### Owner
- **Dashboard**, Add Car, **Manage Cars**, **Bookings**, **Finances**, **Incidents**, Tesla
- Update profile image; toggle car availability; edit weekly price
- Invoices: PDF download (meaningful filename, PAID/CANCELLED watermark, company info, card last4/brand)

### Backend
- **Stripe**: checkout session, confirm payment, webhook → create booking + invoice; card last4/brand stored
- **Invoices**: PDF (PDFKit), optional company name/email/phone in env
- **Email** (optional): booking confirmation & cancellation (Nodemailer, SMTP env)
- Dates: Irvine **PST** for “today”; UTC for 7/14/21-day weekly math

---

## Tech Stack

| Layer      | Tech |
| ---------- | -----|
| Frontend   | React, Vite, React Router, Axios, Context API, Tailwind, Framer Motion |
| Backend    | Node.js, Express, MongoDB/Mongoose, JWT, Multer |
| Payments   | Stripe (Checkout, Webhook) |
| Media      | ImageKit |
| PDF        | PDFKit |
| Email      | Nodemailer (optional) |

---

## Folder Structure

```
mongoori-rides/
├── client/                      # React (Vite)
│   ├── src/
│   │   ├── assets/              # images, icons, owner menu config
│   │   ├── components/         # Navbar, Footer, Login, CarCard, Banner, owner/Sidebar, NavbarOwner…
│   │   ├── context/            # AppContext (user, token, cars, fetchUser, …)
│   │   ├── pages/
│   │   │   ├── Home.jsx, Fleet (Cars.jsx), CarDetails.jsx, MyBookings.jsx
│   │   │   ├── BookingSuccess.jsx
│   │   │   ├── Insurance.jsx, PrivacyPolicy.jsx, TermsOfUse.jsx, OurStory.jsx
│   │   │   └── owner/
│   │   │       ├── Layout.jsx, Dashboard.jsx, AddCar.jsx, ManageCars.jsx
│   │   │       ├── ManageBookings.jsx, Finances.jsx, Incidentals.jsx, Tesla.jsx
│   │   ├── App.jsx, main.jsx
│   │   └── …
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Express API
│   ├── configs/                # db.js, imageKit.js
│   ├── controllers/
│   │   ├── bookingController.js, paymentController.js, invoiceController.js
│   │   ├── ownerController.js, userController.js, incidentalController.js
│   ├── middleware/             # auth.js, multer.js
│   ├── models/
│   │   ├── User.js, Car.js, Booking.js, Invoice.js, Incidental.js, Toll.js
│   ├── routes/
│   │   ├── userRoutes.js, bookingRoutes.js, paymentRoutes.js, invoiceRoutes.js
│   │   ├── ownerRoutes.js, incidentalRoutes.js, teslaRoutes.js
│   ├── services/
│   │   ├── emailService.js, fastrakService.js, teslaFleetService.js
│   ├── scripts/                # e.g. wipeBookings.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## Environment Variables

### Server (`.env`)

Copy from `server/.env.example`. Required / used:

```env
MONGODB_URI=...
JWT_SECRET=...
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5173
STRIPE_WEBHOOK_SECRET=whsec_...   # from: stripe listen --forward-to localhost:3000/api/payment/webhook

# Optional: invoice company (PDF footer)
INVOICE_COMPANY_NAME=Mongoori Rides
INVOICE_COMPANY_EMAIL=contact@mongoori.com
INVOICE_COMPANY_PHONE=

# Optional: email on booking confirm / cancel
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Client (`.env`)

Copy from `client/.env.example`. For local dev leave `VITE_BASE_URL` empty so Vite proxies `/api` to the backend.

```env
VITE_BASE_URL=
VITE_CURRENCY=$
```

---

## Local Setup

### 1. Clone

```bash
git clone https://github.com/sawolsamsip/mongoori-rides.git
cd mongoori-rides
```

### 2. Backend

```bash
cd server
cp .env.example .env   # edit with your keys
npm install
npm run server
```

Runs at [http://localhost:3000](http://localhost:3000).

### 3. Frontend

```bash
cd client
cp .env.example .env   # leave VITE_BASE_URL empty for dev
npm install
npm run dev
```

Runs at [http://localhost:5173](http://localhost:5173).

### 4. Stripe (optional for full flow)

- Set `STRIPE_SECRET_KEY` and `FRONTEND_URL` in `server/.env`.
- For “payment completed → booking created” without redirect:
  ```bash
  stripe listen --forward-to localhost:3000/api/payment/webhook
  ```
  Put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET`.
- Test card: **4242 4242 4242 4242**, any future expiry, any CVC.

---

## API Overview

| Area        | Examples |
| ----------- | -------- |
| Auth        | `POST /api/auth/register`, `POST /api/auth/login` |
| User        | `GET /api/user/data`, `GET /api/user/cars` |
| Bookings    | `GET /api/bookings/user`, `POST /api/bookings/cancel`, `GET /api/bookings/check-dates` |
| Payment     | `POST /api/payment/create-checkout-session`, `POST /api/payment/confirm-payment`, `POST /api/payment/webhook` |
| Invoices    | `GET /api/invoices/booking/:id`, `GET /api/invoices/booking/:id/download` |
| Owner       | `GET /api/owner/cars`, `POST /api/owner/update-image`, `POST /api/owner/toggle-car`, … |
| Incidents   | `POST /api/incidentals/`, … |

(Exact routes: see `server/routes/*.js`.)

---

## Build & Deploy

- **Frontend**: `cd client && npm run build` → `dist/`. Deploy (e.g. Vercel) with root = `client`, build = `npm run build`, output = `dist`. Set `VITE_BASE_URL` to your API URL in production.
- **Backend**: Deploy `server` (e.g. Render), set env vars, expose `/api/payment/webhook` for Stripe.

---

## License

Open source. Feel free to fork and adapt.
