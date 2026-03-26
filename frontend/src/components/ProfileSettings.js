import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Lock, Bell, Globe,
  Camera, Save, X, Check, Edit2, Shield, Eye, EyeOff,
  AlertCircle, CheckCircle, Truck, Calendar
} from 'lucide-react';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'security', 'notifications', 'preferences'
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    vehicleNumber: '',
    vehicleType: '',
    licenseNumber: '',
    joinDate: ''
  });

  // Security
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newPickupAlert: true,
    completionReminder: true,
    paymentNotification: true,
    performanceUpdate: false
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: 'light',
    mapStyle: 'default',
    autoAcceptPickups: false,
    workingHours: {
      start: '06:00',
      end: '18:00'
    },
    serviceRadius: 10
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPersonalInfo({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address?.street || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          pincode: data.address?.pincode || '',
          vehicleNumber: 'PB-12-AB-1234',
          vehicleType: 'Bike',
          licenseNumber: 'DL1234567890',
          joinDate: data.createdAt || new Date()
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({
      ...personalInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleSecurityChange = (e) => {
    setSecurity({
      ...security,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationChange = (e) => {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked
    });
  };

  const handlePreferenceChange = (e) => {
    setPreferences({
      ...preferences,
      [e.target.name]: e.target.value
    });
  };

  const savePersonalInfo = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Personal information updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update personal information');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (security.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Password changed successfully!');
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Notification preferences saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save notifications');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Preferences saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  return (
    <div className="profile-settings-container">
      {/* Header */}
      <div className="profile-header">
        <div className="header-title-section">
          <h2>Profile Settings</h2>
          <p>Manage your account information and preferences</p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="alert-profile success">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-profile error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <User size={18} />
          Personal Info
        </button>
        <button 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={18} />
          Security
        </button>
        <button 
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={18} />
          Notifications
        </button>
        <button 
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Globe size={18} />
          Preferences
        </button>
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <div className="tab-content">
          <div className="profile-avatar-section">
            <div className="avatar-circle">
              <User size={64} />
            </div>
            <button className="change-avatar-btn">
              <Camera size={16} />
              Change Photo
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group-profile">
              <label>
                <User size={16} />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={personalInfo.name}
                onChange={handlePersonalInfoChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group-profile">
              <label>
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={personalInfo.email}
                onChange={handlePersonalInfoChange}
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group-profile">
              <label>
                <Phone size={16} />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={personalInfo.phone}
                onChange={handlePersonalInfoChange}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="form-group-profile">
              <label>
                <Calendar size={16} />
                Join Date
              </label>
              <input
                type="text"
                value={new Date(personalInfo.joinDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
                disabled
              />
            </div>
          </div>

          <div className="form-section-title">
            <MapPin size={20} />
            Address Information
          </div>

          <div className="form-group-profile full-width">
            <label>Street Address</label>
            <textarea
              name="address"
              value={personalInfo.address}
              onChange={handlePersonalInfoChange}
              placeholder="Enter your address"
              rows="3"
            />
          </div>

          <div className="form-grid">
            <div className="form-group-profile">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={personalInfo.city}
                onChange={handlePersonalInfoChange}
                placeholder="City"
              />
            </div>

            <div className="form-group-profile">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={personalInfo.state}
                onChange={handlePersonalInfoChange}
                placeholder="State"
              />
            </div>

            <div className="form-group-profile">
              <label>PIN Code</label>
              <input
                type="text"
                name="pincode"
                value={personalInfo.pincode}
                onChange={handlePersonalInfoChange}
                placeholder="110001"
              />
            </div>
          </div>

          <div className="form-section-title">
            <Truck size={20} />
            Vehicle Information
          </div>

          <div className="form-grid">
            <div className="form-group-profile">
              <label>Vehicle Number</label>
              <input
                type="text"
                name="vehicleNumber"
                value={personalInfo.vehicleNumber}
                onChange={handlePersonalInfoChange}
                placeholder="PB-12-AB-1234"
              />
            </div>

            <div className="form-group-profile">
              <label>Vehicle Type</label>
              <select
                name="vehicleType"
                value={personalInfo.vehicleType}
                onChange={handlePersonalInfoChange}
              >
                <option value="Bike">Bike</option>
                <option value="Auto">Auto</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
              </select>
            </div>

            <div className="form-group-profile">
              <label>License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={personalInfo.licenseNumber}
                onChange={handlePersonalInfoChange}
                placeholder="DL1234567890"
              />
            </div>
          </div>

          <button className="save-btn-profile" onClick={savePersonalInfo} disabled={saving}>
            {saving ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="tab-content">
          <div className="security-info-card">
            <Shield size={32} />
            <div>
              <h4>Change Your Password</h4>
              <p>Ensure your account is secure by using a strong password</p>
            </div>
          </div>

          <div className="form-group-profile">
            <label>
              <Lock size={16} />
              Current Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={security.currentPassword}
                onChange={handleSecurityChange}
                placeholder="Enter current password"
              />
              <button 
                className="toggle-password-btn"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group-profile">
            <label>
              <Lock size={16} />
              New Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={security.newPassword}
                onChange={handleSecurityChange}
                placeholder="Enter new password"
              />
              <button 
                className="toggle-password-btn"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group-profile">
            <label>
              <Lock size={16} />
              Confirm New Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={security.confirmPassword}
                onChange={handleSecurityChange}
                placeholder="Confirm new password"
              />
              <button 
                className="toggle-password-btn"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="save-btn-profile" onClick={changePassword} disabled={saving}>
            {saving ? 'Changing...' : (
              <>
                <Shield size={18} />
                Change Password
              </>
            )}
          </button>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="tab-content">
          <div className="notification-group">
            <h4>Delivery Channels</h4>
            <div className="notification-item">
              <div className="notification-info">
                <Mail size={20} />
                <div>
                  <strong>Email Notifications</strong>
                  <p>Receive updates via email</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={notifications.emailNotifications}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <Phone size={20} />
                <div>
                  <strong>SMS Notifications</strong>
                  <p>Receive updates via SMS</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="smsNotifications"
                  checked={notifications.smsNotifications}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <Bell size={20} />
                <div>
                  <strong>Push Notifications</strong>
                  <p>Receive push notifications in browser</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="pushNotifications"
                  checked={notifications.pushNotifications}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="notification-group">
            <h4>Activity Alerts</h4>
            <div className="notification-item">
              <div className="notification-info">
                <CheckCircle size={20} />
                <div>
                  <strong>New Pickup Alert</strong>
                  <p>Get notified when new pickup is assigned</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="newPickupAlert"
                  checked={notifications.newPickupAlert}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <Bell size={20} />
                <div>
                  <strong>Completion Reminder</strong>
                  <p>Reminders for pending pickups</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="completionReminder"
                  checked={notifications.completionReminder}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <CheckCircle size={20} />
                <div>
                  <strong>Payment Notification</strong>
                  <p>Updates about your earnings</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="paymentNotification"
                  checked={notifications.paymentNotification}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="notification-item">
              <div className="notification-info">
                <CheckCircle size={20} />
                <div>
                  <strong>Performance Update</strong>
                  <p>Weekly performance reports</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="performanceUpdate"
                  checked={notifications.performanceUpdate}
                  onChange={handleNotificationChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <button className="save-btn-profile" onClick={saveNotifications} disabled={saving}>
            {saving ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Preferences
              </>
            )}
          </button>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="tab-content">
          <div className="form-group-profile">
            <label>
              <Globe size={16} />
              Language
            </label>
            <select
              name="language"
              value={preferences.language}
              onChange={handlePreferenceChange}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="pa">Punjabi</option>
            </select>
          </div>

          <div className="form-group-profile">
            <label>Working Hours</label>
            <div className="working-hours-grid">
              <input
                type="time"
                value={preferences.workingHours.start}
                onChange={(e) => setPreferences({
                  ...preferences,
                  workingHours: { ...preferences.workingHours, start: e.target.value }
                })}
              />
              <span>to</span>
              <input
                type="time"
                value={preferences.workingHours.end}
                onChange={(e) => setPreferences({
                  ...preferences,
                  workingHours: { ...preferences.workingHours, end: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="form-group-profile">
            <label>Service Radius (km)</label>
            <input
              type="number"
              name="serviceRadius"
              value={preferences.serviceRadius}
              onChange={handlePreferenceChange}
              min="1"
              max="50"
            />
            <small>Maximum distance you're willing to travel for pickups</small>
          </div>

          <button className="save-btn-profile" onClick={savePreferences} disabled={saving}>
            {saving ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Preferences
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;