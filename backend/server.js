// Force DNS resolution (Fix MongoDB ENOTFOUND issue)
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Google DNS

// Import required packages
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Import routes
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const wasteRoutes = require('./routes/waste.routes');
const pickupRoutes = require('./routes/pickup.routes');
const wasteTrackingRoutes = require('./routes/wasteTracking.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const notificationRoutes = require('./routes/notification.routes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Smart Waste Management API!',
    status: 'Server is running 🚀',
    database: 'Connected ✅'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/waste-tracking', wasteTrackingRoutes);

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`📦 Waste Tracking API: http://localhost:${PORT}/api/waste-tracking`);
});