import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TermsModal from '../components/TermsModal';
import './Login.css';

const API = 'http://localhost:5000/api/auth';

const F_EMAIL = 'email';
const F_OTP   = 'otp';
const F_RESET = 'reset';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [panel, setPanel] = useState('signin');

  // sign-in
  const [loginData, setLoginData]     = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe]   = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError]   = useState('');

  // sign-up
  const [step, setStep]               = useState(1);
  const [registerData, setRegisterData] = useState({ name:'', email:'', password:'', confirmPassword:'', userType:'' });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // forgot / OTP
  const [fStep, setFStep]             = useState(F_EMAIL);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotInfo, setForgotInfo]   = useState('');
  const [otpLoading, setOtpLoading]         = useState(false);
  const [resetLinkLoading, setResetLinkLoading] = useState(false);
  const [otp, setOtp]                 = useState(['','','','','','']);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const [resetToken, setResetToken]   = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');

  const timerRef = useRef(null);
  const otpRefs  = useRef([]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    const savedEmail    = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const wasRemembered = localStorage.getItem('rememberMe') === 'true';
    if (wasRemembered && savedEmail) {
      setLoginData({ email: savedEmail, password: savedPassword || '' });
      setRememberMe(true);
    }
  }, []);

  const startTimer = () => {
    setOtpTimeLeft(600);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
    }, 1000);
  };

  const formatTime = (s) =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // panel switches
  const goSignup = () => {
    setLoginError(''); setRegisterError(''); setStep(1);
    setRegisterData({ name:'', email:'', password:'', confirmPassword:'', userType:'' });
    setTermsAccepted(false); setPanel('signup');
  };
  const goSignin = () => {
    setLoginError(''); setRegisterError(''); setForgotError(''); setForgotInfo('');
    clearInterval(timerRef.current); setPanel('signin');
  };
  const goForgot = () => {
    setLoginError(''); setForgotError(''); setForgotInfo('');
    setForgotEmail(''); setFStep(F_EMAIL);
    setOtp(['','','','','','']); setNewPassword(''); setConfirmPwd('');
    setPanel('forgot');
  };

  // sign-in
  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleLoginSubmit = async (e) => {
    e.preventDefault(); setLoginLoading(true); setLoginError('');
    try {
      const result = await login(loginData);
      setLoginLoading(false);
      if (result.success && result.data) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', loginData.email);
          localStorage.setItem('rememberedPassword', loginData.password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
          localStorage.removeItem('rememberMe');
        }
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('userType', result.data.userType);
        if      (result.data.userType === 'citizen')      navigate('/citizen/dashboard');
        else if (result.data.userType === 'pickup_agent') navigate('/agent/dashboard');
        else if (result.data.userType === 'industry')     navigate('/industry/dashboard');
        else if (result.data.userType === 'admin')        navigate('/admin/dashboard');
        else setLoginError('Unknown user type. Please contact support.');
      } else {
        setLoginError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch { setLoginLoading(false); setLoginError('Something went wrong. Please try again.'); }
  };

  // sign-up
  const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  const handleNext = () => { if (!registerData.userType) { setRegisterError('Please select a user type'); return; } setRegisterError(''); setStep(2); };
  const handleBack = () => { setRegisterError(''); setStep(1); };
  const handleTermsCheckboxChange = (e) => setTermsAccepted(e.target.checked);
  const handleTermsLinkClick = (e) => { e.preventDefault(); setShowTermsModal(true); };
  const handleAcceptTerms = () => { setTermsAccepted(true); setShowTermsModal(false); };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault(); setRegisterError('');
    if (!termsAccepted) { setRegisterError('You must agree to the Terms & Conditions'); setShowTermsModal(true); return; }
    if (registerData.password !== registerData.confirmPassword) { setRegisterError('Passwords do not match'); return; }
    if (registerData.password.length < 6) { setRegisterError('Password must be at least 6 characters'); return; }
    setRegisterLoading(true);
    const result = await register({ name: registerData.name, email: registerData.email, password: registerData.password, userType: registerData.userType });
    setRegisterLoading(false);
    if (result.success) { setShowSuccessModal(true); setTimeout(() => { setShowSuccessModal(false); setPanel('signin'); setStep(1); }, 2000); }
    else setRegisterError(result.error || 'Registration failed. Please try again.');
  };

  const getUserTypeLabel = (type) => ({ citizen:'Citizen', industry:'Industry', pickup_agent:'PickUp Agent' }[type] || '');

  // forgot / OTP handlers
  const handleSendOTP = async () => {
    if (!forgotEmail) { setForgotError('Please enter your email address'); return; }
    setOtpLoading(true); setForgotError(''); setForgotInfo('');
    try {
      const res  = await fetch(`${API}/send-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: forgotEmail }) });
      const data = await res.json();
      setOtpLoading(false);
      if (data.success) { setForgotInfo('OTP sent! Check your inbox.'); startTimer(); setFStep(F_OTP); setTimeout(() => otpRefs.current[0]?.focus(), 200); }
      else setForgotError(data.message || 'Failed to send OTP.');
    } catch { setOtpLoading(false); setForgotError('Network error. Please try again.'); }
  };

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { setForgotError('Please enter your email address'); return; }
    setResetLinkLoading(true); setForgotError(''); setForgotInfo('');
    try {
      const res  = await fetch(`${API}/forgot-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: forgotEmail }) });
      const data = await res.json();
      setResetLinkLoading(false);
      if (data.success) setForgotInfo('Reset link sent! Check your inbox.');
      else setForgotError(data.message || 'Failed to send reset link.');
    } catch { setResetLinkLoading(false); setForgotError('Network error.'); }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp]; next[index] = value.slice(-1); setOtp(next);
    if (value && index < 5) otpRefs.current[index+1]?.focus();
  };
  const handleOtpKeyDown = (index, e) => { if (e.key==='Backspace' && !otp[index] && index>0) otpRefs.current[index-1]?.focus(); };
  const handleOtpPaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (p.length===6) { setOtp(p.split('')); otpRefs.current[5]?.focus(); }
  };

  const handleVerifyOTP = async () => {
    const otpVal = otp.join('');
    if (otpVal.length!==6) { setForgotError('Please enter the complete 6-digit OTP'); return; }
    setOtpLoading(true); setForgotError(''); setForgotInfo('');
    try {
      const res  = await fetch(`${API}/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: forgotEmail, otp: otpVal }) });
      const data = await res.json();
      setOtpLoading(false);
      if (data.success) { setResetToken(data.resetToken); clearInterval(timerRef.current); setForgotInfo(''); setFStep(F_RESET); }
      else setForgotError(data.message || 'Invalid OTP.');
    } catch { setOtpLoading(false); setForgotError('Network error.'); }
  };

  const handleResendOTP = async () => {
    setOtp(['','','','','','']); setForgotError(''); setForgotInfo(''); setOtpLoading(true);
    try {
      const res  = await fetch(`${API}/send-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: forgotEmail }) });
      const data = await res.json();
      setOtpLoading(false);
      if (data.success) { setForgotInfo('New OTP sent!'); startTimer(); setTimeout(() => otpRefs.current[0]?.focus(), 200); }
      else setForgotError(data.message || 'Failed to resend.');
    } catch { setOtpLoading(false); setForgotError('Network error.'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length<6) { setForgotError('Password must be at least 6 characters'); return; }
    if (newPassword!==confirmPwd) { setForgotError('Passwords do not match'); return; }
    setOtpLoading(true); setForgotError(''); setForgotInfo('');
    try {
      const res  = await fetch(`${API}/reset-password-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ resetToken, password: newPassword, confirmPassword: confirmPwd }) });
      const data = await res.json();
      setOtpLoading(false);
      if (data.success) { setForgotInfo('Password reset! Redirecting...'); setTimeout(() => goSignin(), 2000); }
      else setForgotError(data.message || 'Failed to reset password.');
    } catch { setOtpLoading(false); setForgotError('Network error.'); }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className={`forms-track ${panel==='signup'?'show-signup':''} ${panel==='forgot'?'show-forgot':''}`}>

          {/* ══ PANE 1 — SIGN IN ══ */}
          <div className="form-pane">
            <div className="logo-section">
              <div className="logo-icon">♻️</div>
              <h1 className="logo-text">WasteWise</h1>
            </div>
            <div className="login-form-container">
              <h2 className="form-title">Log in to your account</h2>
              <p className="form-subtitle">Don't have an account? <button className="link-btn" onClick={goSignup}>Sign Up</button></p>
              {loginError && <div className="alert alert-error"><span className="alert-icon">⚠️</span>{loginError}</div>}
              <form onSubmit={handleLoginSubmit} className="login-form">
                <div className="form-divider"><span>Or with email and password</span></div>
                <div className="form-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input type="email" id="login-email" name="email" value={loginData.email} onChange={handleLoginChange} placeholder="abc@example.com" required autoComplete="email"/>
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <input type="password" id="login-password" name="password" value={loginData.password} onChange={handleLoginChange} placeholder="Enter your password" required autoComplete="current-password"/>
                </div>
                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}/>
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="forgot-link" onClick={goForgot}>Forgot Password?</button>
                </div>
                {/* ✅ FIX: spinner is a plain <span> — no extra classes, no self-closing */}
                <button type="submit" className="btn-login" disabled={loginLoading}>
                  {loginLoading
                    ? <><span className="spinner"></span><span>Logging in...</span></>
                    : 'Log In'
                  }
                </button>
              </form>
            </div>
          </div>

          {/* ══ PANE 2 — SIGN UP ══ */}
          <div className="form-pane">
            <div className="logo-section">
              <div className="logo-icon">♻️</div>
              <h1 className="logo-text">WasteWise</h1>
            </div>
            <div className="login-form-container">
              {step === 1 ? (
                <>
                  <h2 className="form-title">Create your account</h2>
                  <p className="form-subtitle">Sign up as a</p>
                  {registerError && <div className="alert alert-error"><span className="alert-icon">⚠️</span>{registerError}</div>}
                  <div className="form-group">
                    <label htmlFor="userType">Select User Type</label>
                    <select id="userType" name="userType" value={registerData.userType} onChange={handleRegisterChange} className="user-type-dropdown" required>
                      <option value="">-- Select User Type --</option>
                      <option value="citizen">Citizen</option>
                      <option value="pickup_agent">PickUp Agent</option>
                    </select>
                  </div>
                  <button type="button" className="btn-login" onClick={handleNext}>Next</button>
                  <p className="form-subtitle" style={{marginTop:'24px'}}>Already have an account? <button className="link-btn" onClick={goSignin}>Log In</button></p>
                </>
              ) : (
                <>
                  <h2 className="form-title">Complete your details</h2>
                  <p className="form-subtitle">Signing up as <strong>{getUserTypeLabel(registerData.userType)}</strong></p>
                  {registerError && <div className="alert alert-error"><span className="alert-icon">⚠️</span>{registerError}</div>}
                  <form onSubmit={handleRegisterSubmit} className="login-form">
                    <div className="form-group">
                      <label htmlFor="reg-name">Full Name</label>
                      <input type="text" id="reg-name" name="name" value={registerData.name} onChange={handleRegisterChange} placeholder="John Doe" required autoComplete="name"/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="reg-email">Email Address</label>
                      <input type="email" id="reg-email" name="email" value={registerData.email} onChange={handleRegisterChange} placeholder="abc@example.com" required autoComplete="email"/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="reg-password">Password</label>
                      <input type="password" id="reg-password" name="password" value={registerData.password} onChange={handleRegisterChange} placeholder="Enter your password" required autoComplete="new-password" minLength="6"/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="reg-confirmPassword">Confirm Password</label>
                      <input type="password" id="reg-confirmPassword" name="confirmPassword" value={registerData.confirmPassword} onChange={handleRegisterChange} placeholder="Confirm your password" required autoComplete="new-password" minLength="6"/>
                    </div>
                    <div className="form-terms">
                      <label className="terms-checkbox">
                        <input type="checkbox" checked={termsAccepted} onChange={handleTermsCheckboxChange}/>
                        <span>I agree to the <button type="button" className="terms-link" onClick={handleTermsLinkClick}>Terms & Conditions</button></span>
                      </label>
                    </div>
                    <div className="button-group">
                      <button type="button" className="btn-back" onClick={handleBack}>Back</button>
                      {/* ✅ FIX: text wrapped in <span> so flex gap applies consistently */}
                      <button type="submit" className="btn-login btn-submit" disabled={registerLoading}>
                        {registerLoading
                          ? <><span className="spinner"></span><span>Creating Account...</span></>
                          : 'Sign Up'
                        }
                      </button>
                    </div>
                  </form>
                  <p className="form-subtitle" style={{marginTop:'24px'}}>Already have an account? <button className="link-btn" onClick={goSignin}>Log In</button></p>
                </>
              )}
            </div>
          </div>

          {/* ══ PANE 3 — FORGOT / OTP ══ */}
          <div className="form-pane forgot-pane">
            <div className="logo-section">
              <div className="logo-icon">♻️</div>
              <h1 className="logo-text">WasteWise</h1>
            </div>
            <div className="login-form-container">

              {/* Step dots */}
              <div className="otp-steps">
                {[F_EMAIL, F_OTP, F_RESET].map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`otp-step-dot ${fStep===s?'active':''} ${[F_EMAIL,F_OTP,F_RESET].indexOf(fStep)>i?'done':''}`}>
                      {[F_EMAIL,F_OTP,F_RESET].indexOf(fStep)>i?'✓':i+1}
                    </div>
                    {i<2 && <div className={`otp-step-line ${[F_EMAIL,F_OTP,F_RESET].indexOf(fStep)>i?'done':''}`}/>}
                  </React.Fragment>
                ))}
              </div>

              {forgotError && <div className="alert alert-error"><span className="alert-icon">⚠️</span>{forgotError}</div>}
              {forgotInfo  && <div className="alert alert-success"><span className="alert-icon">✓</span>{forgotInfo}</div>}

              {/* F_EMAIL */}
              {fStep === F_EMAIL && (
                <>
                  <h2 className="form-title">Forgot Password?</h2>
                  <p className="form-subtitle">Enter your email to get an OTP or a reset link.</p>
                  <div className="form-group">
                    <label htmlFor="forgot-email">Email Address</label>
                    <div className="email-otp-row">
                      <input type="email" id="forgot-email" value={forgotEmail}
                        onChange={e => { setForgotEmail(e.target.value); setForgotError(''); setForgotInfo(''); }}
                        placeholder="abc@example.com" autoComplete="email" className="email-otp-input"/>
                      {/* ✅ FIX: use spinner-sm only (not both classes), wrapped in <span> */}
                      <button type="button" className="btn-send-otp" onClick={handleSendOTP} disabled={otpLoading||resetLinkLoading||!forgotEmail}>
                        {otpLoading
                          ? <span className="spinner-sm"></span>
                          : 'Send OTP'
                        }
                      </button>
                    </div>
                  </div>
                  <div className="or-divider"><span>or</span></div>
                  <button type="button" className="btn-login" onClick={handleSendResetLink} disabled={resetLinkLoading||otpLoading||!forgotEmail}>
                    {resetLinkLoading
                      ? <><span className="spinner"></span><span>Sending...</span></>
                      : 'Send Reset Link'
                    }
                  </button>
                  <div style={{marginTop:'20px',textAlign:'center'}}>
                    <button className="link-btn" onClick={goSignin}>← Back to Log In</button>
                  </div>
                </>
              )}

              {/* F_OTP */}
              {fStep === F_OTP && (
                <>
                  <h2 className="form-title">Enter OTP</h2>
                  <p className="form-subtitle">6-digit code sent to <strong style={{color:'#00684A'}}>{forgotEmail}</strong></p>
                  <div className="otp-boxes" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input key={i} ref={el => otpRefs.current[i]=el}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className={`otp-box ${digit?'filled':''}`}/>
                    ))}
                  </div>
                  <div className="otp-timer">
                    {otpTimeLeft>0
                      ? <span>Expires in <strong>{formatTime(otpTimeLeft)}</strong></span>
                      : <span className="otp-expired">OTP expired — please resend</span>}
                  </div>
                  <button type="button" className="btn-login" onClick={handleVerifyOTP} disabled={otpLoading||otp.join('').length!==6}>
                    {otpLoading
                      ? <><span className="spinner"></span><span>Verifying...</span></>
                      : 'Verify OTP'
                    }
                  </button>
                  <div className="otp-footer-row">
                    <span>Didn't receive it?</span>
                    <button type="button" className="link-btn" onClick={handleResendOTP} disabled={otpLoading}>Resend OTP</button>
                  </div>
                  <div style={{textAlign:'center',marginTop:'6px'}}>
                    <button className="link-btn otp-back" onClick={() => { setFStep(F_EMAIL); setForgotError(''); setForgotInfo(''); clearInterval(timerRef.current); }}>
                      ← Change email
                    </button>
                  </div>
                </>
              )}

              {/* F_RESET */}
              {fStep === F_RESET && (
                <>
                  <h2 className="form-title">Set New Password</h2>
                  <p className="form-subtitle">Choose a strong password for your account.</p>
                  <form onSubmit={handleResetPassword} className="login-form">
                    <div className="form-group">
                      <label>New Password</label>
                      <input type="password" value={newPassword} placeholder="Min. 6 characters"
                        onChange={e => { setNewPassword(e.target.value); setForgotError(''); }} autoComplete="new-password"/>
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input type="password" value={confirmPwd} placeholder="Re-enter your password"
                        onChange={e => { setConfirmPwd(e.target.value); setForgotError(''); }} autoComplete="new-password"/>
                      {confirmPwd && (
                        <span className={`pwd-match ${newPassword===confirmPwd?'match':'no-match'}`}>
                          {newPassword===confirmPwd ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </span>
                      )}
                    </div>
                    <button type="submit" className="btn-login" disabled={otpLoading||!newPassword||!confirmPwd}>
                      {otpLoading
                        ? <><span className="spinner"></span><span>Resetting...</span></>
                        : 'Reset Password'
                      }
                    </button>
                  </form>
                </>
              )}

            </div>
          </div>

        </div>
      </div>

      <div className="login-right">
        <img src="/green_earth.jpg" alt="Green Earth - Sustainable Future" className="background-image"/>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} onAccept={handleAcceptTerms}/>

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">✓</div>
            <h2 className="modal-title">Account Created!</h2>
            <p className="modal-text">Your account has been successfully created.<br/>Redirecting to login...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;