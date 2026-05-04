// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { sendOTP, verifyOTP, resetPasswordWithOTP, sendRegisterOTP, verifyRegisterOTP } = require('../controllers/otpController');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Link-based password reset (original)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// OTP-based password reset
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password-otp', resetPasswordWithOTP);

// Email verification OTP during registration (new)
router.post('/send-register-otp', sendRegisterOTP);
router.post('/verify-register-otp', verifyRegisterOTP);

// Protected routes
router.get('/profile', protect, getUserProfile);

module.exports = router;