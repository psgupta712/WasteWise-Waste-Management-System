// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { sendOTP, verifyOTP, resetPasswordWithOTP } = require('../controllers/otpController');
const { protect } = require('../middleware/auth.middleware');

// Public routes (no login required)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Original link-based reset (keep as-is)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// OTP-based reset (new)
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password-otp', resetPasswordWithOTP);

// Protected routes (login required)
router.get('/profile', protect, getUserProfile);

module.exports = router;