// backend/controllers/otpController.js
const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// In-memory OTP store: { email -> { otp, expiresAt, verified } }
// For production, use Redis or store in DB
const otpStore = new Map();

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────────────────────
// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
// ─────────────────────────────────────────────────────────────
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Security: don't reveal whether email exists
      return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP (overwrite any previous one)
    otpStore.set(email, { otp, expiresAt, verified: false });

    // Email HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fbe7; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #c8e6c9; }
          .otp-box { background: #ffffff; border: 2px solid #2d6a4f; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 42px; font-weight: 700; letter-spacing: 10px; color: #1b4332; font-family: monospace; }
          .expire-note { color: #d97706; font-size: 14px; font-weight: 600; margin: 0; }
          .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>♻️ WasteWise</h1>
            <h2>Password Reset OTP</h2>
          </div>
          <div class="content">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>You requested to reset your WasteWise password. Use the OTP below to verify your identity:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p class="expire-note">⏱ This OTP expires in 10 minutes</p>
            </div>
            <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
            <p>Best regards,<br><strong>The WasteWise Team</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WasteWise. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject: 'Your OTP for Password Reset - WasteWise',
      html,
    });

    res.status(200).json({ success: true, message: 'OTP sent to your email' });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const record = otpStore.get(email);

    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP found for this email. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified — allows password reset
    otpStore.set(email, { ...record, verified: true });

    // Generate a short-lived reset token for the password step
    const resetToken = crypto.randomBytes(32).toString('hex');
    const user = await User.findOne({ email });

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      resetToken, // send to frontend to use in next step
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Reset password using OTP-issued token
// @route   POST /api/auth/reset-password-otp
// @access  Public
// ─────────────────────────────────────────────────────────────
const resetPasswordWithOTP = async (req, res) => {
  try {
    const { resetToken, password, confirmPassword } = req.body;

    if (!resetToken || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired session. Please start again.' });
    }

    // Clear OTP store
    otpStore.delete(user.email);

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Successful - WasteWise',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#1b4332,#2d6a4f);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
              <h1>♻️ WasteWise</h1><h2>Password Reset Successful</h2>
            </div>
            <div style="background:#f9fbe7;padding:30px;border-radius:0 0 8px 8px;border:1px solid #c8e6c9;">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>Your WasteWise password has been successfully reset. You can now log in with your new password.</p>
              <p>If you didn't make this change, please contact support immediately.</p>
              <p>Best regards,<br><strong>The WasteWise Team</strong></p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Confirmation email failed:', emailErr);
    }

    res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });

  } catch (error) {
    console.error('Reset password OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

module.exports = { sendOTP, verifyOTP, resetPasswordWithOTP };