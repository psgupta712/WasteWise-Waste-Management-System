import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const API = 'http://localhost:5000/api/auth';

// ── Step constants ───────────────────────────────────────────
const STEP_EMAIL  = 'email';   // enter email, send OTP + reset link
const STEP_OTP    = 'otp';     // enter OTP, verify
const STEP_RESET  = 'reset';   // enter new password

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep]               = useState(STEP_EMAIL);
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken]   = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');

  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [info, setInfo]               = useState('');   // success/info message

  // OTP timer
  const [timeLeft, setTimeLeft]       = useState(0);
  const timerRef                      = useRef(null);

  // OTP input refs for auto-focus
  const otpRefs = useRef([]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startTimer = () => {
    setTimeLeft(600); // 10 min
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Step 1: Send OTP ─────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      const res  = await fetch(`${API}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setInfo('OTP sent! Check your inbox.');
        startTimer();
        setStep(STEP_OTP);
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Send reset link (existing flow) ───────────────
  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      const res  = await fetch(`${API}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setInfo('Reset link sent! Check your inbox.');
      } else {
        setError(data.message || 'Failed to send reset link.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────
  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      const res  = await fetch(`${API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await res.json();
      if (data.success) {
        setResetToken(data.resetToken);
        clearInterval(timerRef.current);
        setStep(STEP_RESET);
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtp(['', '', '', '', '', '']);
    setError(''); setInfo('');
    setLoading(true);
    try {
      const res  = await fetch(`${API}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setInfo('New OTP sent!');
        startTimer();
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset password ────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPwd) { setError('Passwords do not match'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      const res  = await fetch(`${API}/reset-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, password, confirmPassword: confirmPwd }),
      });
      const data = await res.json();
      if (data.success) {
        setInfo('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="fp-wrapper">

      {/* LEFT — form panel */}
      <div className="fp-left">
        <div className="fp-inner">

          {/* Logo */}
          <div className="fp-logo">
            <span className="fp-logo-icon">♻️</span>
            <span className="fp-logo-text">WasteWise</span>
          </div>

          {/* ── STEP INDICATOR ── */}
          <div className="fp-steps">
            {[STEP_EMAIL, STEP_OTP, STEP_RESET].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`fp-step-dot ${step === s ? 'active' : ''} ${
                  [STEP_EMAIL, STEP_OTP, STEP_RESET].indexOf(step) > i ? 'done' : ''
                }`}>
                  {[STEP_EMAIL, STEP_OTP, STEP_RESET].indexOf(step) > i ? '✓' : i + 1}
                </div>
                {i < 2 && <div className={`fp-step-line ${[STEP_EMAIL, STEP_OTP, STEP_RESET].indexOf(step) > i ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* ── ALERTS ── */}
          {error && (
            <div className="fp-alert fp-alert-error">
              <span>⚠️</span> {error}
            </div>
          )}
          {info && (
            <div className="fp-alert fp-alert-success">
              <span>✓</span> {info}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 1 — EMAIL
          ══════════════════════════════════════════════ */}
          {step === STEP_EMAIL && (
            <div className="fp-card">
              <h2 className="fp-title">Forgot Password?</h2>
              <p className="fp-subtitle">
                Enter your email to receive an OTP or a reset link.
              </p>

              <div className="fp-form-group">
                <label>Email Address</label>
                <div className="fp-email-row">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); setInfo(''); }}
                    placeholder="abc@example.com"
                    className="fp-input"
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    className="fp-btn-otp-inline"
                    onClick={handleSendOTP}
                    disabled={loading || !email}
                  >
                    {loading ? <span className="fp-spinner" /> : 'Send OTP'}
                  </button>
                </div>
              </div>

              <div className="fp-divider"><span>or</span></div>

              <button
                type="button"
                className="fp-btn-primary"
                onClick={handleSendResetLink}
                disabled={loading || !email}
              >
                {loading ? <><span className="fp-spinner" /> Sending...</> : 'Send Reset Link'}
              </button>

              <Link to="/login" className="fp-back-link">← Back to Log In</Link>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 2 — OTP
          ══════════════════════════════════════════════ */}
          {step === STEP_OTP && (
            <div className="fp-card">
              <h2 className="fp-title">Enter OTP</h2>
              <p className="fp-subtitle">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              <div className="fp-otp-grid" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`fp-otp-box ${digit ? 'filled' : ''}`}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="fp-timer">
                {timeLeft > 0 ? (
                  <span>OTP expires in <strong>{formatTime(timeLeft)}</strong></span>
                ) : (
                  <span className="fp-expired">OTP expired</span>
                )}
              </div>

              <button
                type="button"
                className="fp-btn-primary"
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? <><span className="fp-spinner" /> Verifying...</> : 'Verify OTP'}
              </button>

              <div className="fp-resend-row">
                <span>Didn't receive it?</span>
                <button type="button" className="fp-link-btn" onClick={handleResendOTP} disabled={loading}>
                  Resend OTP
                </button>
              </div>

              <button type="button" className="fp-link-btn fp-back-step" onClick={() => { setStep(STEP_EMAIL); setError(''); setInfo(''); clearInterval(timerRef.current); }}>
                ← Change email
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 3 — NEW PASSWORD
          ══════════════════════════════════════════════ */}
          {step === STEP_RESET && (
            <div className="fp-card">
              <h2 className="fp-title">Set New Password</h2>
              <p className="fp-subtitle">
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleResetPassword}>
                <div className="fp-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Min. 6 characters"
                    className="fp-input"
                    autoComplete="new-password"
                  />
                </div>

                <div className="fp-form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={e => { setConfirmPwd(e.target.value); setError(''); }}
                    placeholder="Re-enter your password"
                    className="fp-input"
                    autoComplete="new-password"
                  />
                  {/* Live match indicator */}
                  {confirmPwd && (
                    <span className={`fp-match-hint ${password === confirmPwd ? 'match' : 'no-match'}`}>
                      {password === confirmPwd ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="fp-btn-primary"
                  disabled={loading || !password || !confirmPwd}
                >
                  {loading ? <><span className="fp-spinner" /> Resetting...</> : 'Reset Password'}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT — same nature image */}
      <div className="fp-right">
        <img src="/green_earth.jpg" alt="Green Earth" className="fp-bg-image" />
      </div>

    </div>
  );
};

export default ForgotPassword;