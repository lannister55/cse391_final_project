import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import fareRoutes from './routes/fareRoutes.js';
import { initSocket } from './socket/socketHandler.js';
import { setIO } from './socket/io.js';
import offerRoutes from './routes/offerRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Initialize socket events
initSocket(io);

// Store the io instance so controllers can emit events
setIO(io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Rickshaw CNG API is running' });
});

// API Routes (added module by module)
app.use('/api/auth', authRoutes);      // Module 2 — Authentication
app.use('/api/trips', tripRoutes);     // Module 3 — Trip requests
app.use('/api/fare',  fareRoutes);     // Module 3 — Fare estimation
app.use('/api/offers',  offerRoutes);  // Module 5 — Fare negotiation
app.use('/api/ratings', ratingRoutes); // Module 8 — Rating & Review
app.use('/api/admin',   adminRoutes);  // Module 10 — Admin Dashboard

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
