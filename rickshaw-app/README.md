# RideNego - CNG Fare Negotiation App

A MERN stack application where riders post trips, drivers make fare offers,
and both parties negotiate a mutually acceptable fare in real time.

## Tech Stack

- **Frontend:** React.js + Tailwind CSS + Leaflet.js
- **Backend:** Node.js + Express.js + Socket.io
- **Database:** MongoDB Atlas
- **Auth:** JWT

## Project Structure

```
rickshaw-app/
├── client/         # React frontend (Vite)
└── server/         # Node/Express backend
```

## Getting Started

### 1. Clone and setup

```bash
cd rickshaw-app
```

### 2. Setup Backend

```bash
cd server
npm install
cp ../.env.example .env
# Edit .env and add your MONGO_URI and JWT_SECRET
npm run dev
```

Server runs on: http://localhost:5000

### 3. Setup Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## Environment Variables

Copy `.env.example` to `.env` inside the `server/` folder and fill in:

| Variable     | Description                        |
|--------------|------------------------------------|
| PORT         | Server port (default 5000)         |
| MONGO_URI    | MongoDB Atlas connection string    |
| JWT_SECRET   | Secret key for JWT tokens          |
| CLIENT_URL   | Frontend URL for CORS              |

## Module Progress

- [x] Module 1  - Project Setup
- [x] Module 2  - Authentication
- [x] Module 3  - Rider Trip & Fare
- [x] Module 4  - Driver Dashboard
- [x] Module 5  - Fare Negotiation
- [ ] Module 6  - Trip Status Flow
- [ ] Module 7  - Map & Route
- [ ] Module 8  - Rating & Review
- [ ] Module 9  - Live Tracking
- [ ] Module 10 - Admin Dashboard
- [ ] Module 11 - Testing & Deployment
