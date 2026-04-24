import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, X, Check, AlertCircle, Package,
  MapPin, Clock, User, Phone, FileText, TrendingUp,
  CheckCircle, Loader, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import './CompletePickup.css';

const CompletePickup = () => {
  const [loading, setLoading] = useState(true);
  const [inProgressPickups, setInProgressPickups] = useState([]);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Form states
  const [actualWeight, setActualWeight] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    fetchInProgressPickups();
  }, []);

  const fetchInProgressPickups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/pickup/my-pickups?status=in-progress', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInProgressPickups(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pickups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPickup = (pickup) => {
    setSelectedPickup(pickup);
    setVerificationCode('');
    setActualWeight('');
    setPhoto(null);
    setPhotoPreview(null);
    setNotes('');
    setError('');
    setShowModal(true);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }
      
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const validateForm = () => {
    if (!actualWeight || actualWeight <= 0) {
      setError('Please enter a valid weight');
      return false;
    }
    if (!verificationCode) {
      setError('Please enter the verification code');
      return false;
    }
    if (verificationCode.toUpperCase() !== selectedPickup.verificationCode.toUpperCase()) {
      setError('Invalid verification code');
      return false;
    }
    if (!photo) {
      setError('Please upload a photo of the collected waste');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      // For demo: Just update the pickup without photo upload
      // In production, you'd upload photo to cloud storage first
      const response = await fetch(`http://localhost:5000/api/pickup/${selectedPickup._id}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actualWeight: parseFloat(actualWeight),
          verificationCode: verificationCode.toUpperCase(),
          notes: notes,
          completionPhoto: 'photo-url-would-go-here' // In production, upload photo first
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
          setSelectedPickup(null);
          fetchInProgressPickups();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to complete pickup');
      }
    } catch (error) {
      console.error('Complete pickup error:', error);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    if (!submitting) {
      setShowModal(false);
      setSelectedPickup(null);
      setError('');
      setSuccess(false);
    }
  };

  const getWasteIcon = (type) => {
    const icons = {
      biodegradable: '🍃',
      recyclable: '♻️',
      'e-waste': '📱',
      hazardous: '⚠️'
    };
    return icons[type] || '📦';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeSlotDisplay = (slot) => {
    const slots = {
      morning: '6-10 AM',
      afternoon: '10 AM-2 PM',
      evening: '2-6 PM'
    };
    return slots[slot] || slot;
  };

  if (loading) {
    return (
      <div className="complete-pickup-loading">
        <Loader size={48} className="spinner-complete" />
        <p>Loading in-progress pickups...</p>
      </div>
    );
  }

  return (
    <div className="complete-pickup-container">
      {/* Header */}
      <div className="complete-header">
        <div className="header-title-section">
          {/* <h2>Complete Pickup</h2> */}
          <h3>Finalize pickups with photo verification and weight entry</h3>
        </div>
        <button className="refresh-btn-complete" onClick={fetchInProgressPickups}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Instructions Card */}
      <div className="instructions-card">
        <div className="instructions-icon">
          <CheckCircle size={24} />
        </div>
        <div className="instructions-content">
          <h3>How to Complete a Pickup</h3>
          <ol>
            <li>Select an in-progress pickup from the list below</li>
            <li>Enter the verification code shared by the customer</li>
            <li>Take a clear photo of the collected waste</li>
            <li>Weigh and enter the actual weight</li>
            <li>Submit to complete the pickup</li>
          </ol>
        </div>
      </div>

      {/* In Progress Pickups */}
      {inProgressPickups.length === 0 ? (
        <div className="no-pickups-complete">
          <div className="empty-icon-complete">📦</div>
          <h3>No in-progress pickups</h3>
          <p>Start a pickup from "Assigned Pickups" to see it here</p>
        </div>
      ) : (
        <div className="pickups-complete-grid">
          {inProgressPickups.map((pickup) => (
            <div key={pickup._id} className="pickup-complete-card">
              <div className="pickup-complete-header">
                <div className="pickup-type-complete">
                  <span className="waste-icon-complete">{getWasteIcon(pickup.wasteType)}</span>
                  <div>
                    <h4>{pickup.wasteType}</h4>
                    <span className="pickup-id-complete">#{pickup._id.slice(-6)}</span>
                  </div>
                </div>
                <span className="status-in-progress">In Progress</span>
              </div>

              <div className="pickup-complete-details">
                <div className="detail-item-complete">
                  <Clock size={14} />
                  <span>{formatDate(pickup.pickupDate)} • {getTimeSlotDisplay(pickup.timeSlot)}</span>
                </div>
                <div className="detail-item-complete">
                  <MapPin size={14} />
                  <span>{pickup.address}</span>
                </div>
                {pickup.user && (
                  <div className="detail-item-complete">
                    <User size={14} />
                    <span>{pickup.user.name}</span>
                  </div>
                )}
                {pickup.contactPhone && (
                  <div className="detail-item-complete">
                    <Phone size={14} />
                    <a href={`tel:${pickup.contactPhone}`}>{pickup.contactPhone}</a>
                  </div>
                )}
            
              </div>

              <button 
                className="complete-btn-card"
                onClick={() => handleSelectPickup(pickup)}
              >
                <CheckCircle size={16} />
                Complete Pickup
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completion Modal */}
      {showModal && selectedPickup && (
        <div className="modal-overlay-complete" onClick={closeModal}>
          <div className="modal-complete" onClick={(e) => e.stopPropagation()}>
            {success ? (
              <div className="success-animation">
                <div className="success-checkmark">
                  <CheckCircle size={64} />
                </div>
                <h2>Pickup Completed!</h2>
                <p>Points awarded and customer notified</p>
              </div>
            ) : (
              <>
                <div className="modal-header-complete">
                  <h3>Complete Pickup</h3>
                  <button className="close-modal-btn" onClick={closeModal} disabled={submitting}>
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-body-complete">
                  {/* Pickup Info */}
                  <div className="pickup-info-modal">
                    <div className="info-row-modal">
                      <span className="waste-icon-modal">{getWasteIcon(selectedPickup.wasteType)}</span>
                      <div>
                        <h4>{selectedPickup.wasteType}</h4>
                        <p>{selectedPickup.address}</p>
                      </div>
                    </div>
                    {selectedPickup.user && (
                      <div className="customer-info-modal">
                        <User size={16} />
                        <span>{selectedPickup.user.name}</span>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="error-alert-complete">
                      <AlertCircle size={20} />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="completion-form">
                    {/* Verification Code */}
                    <div className="form-group-complete">
                      <label>
                        <FileText size={16} />
                        Verification Code
                      </label>
                      <input
                        type="text"
                        placeholder="Enter 6-digit code from customer"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        required
                        disabled={submitting}
                      />
                      <small>Ask customer for the verification code shown on their screen</small>
                    </div>

                    {/* Photo Upload */}
                    <div className="form-group-complete">
                      <label>
                        <Camera size={16} />
                        Photo Proof
                      </label>
                      
                      {!photoPreview ? (
                        <div className="photo-upload-area">
                          <div className="upload-options">
                            <button
                              type="button"
                              className="upload-btn camera"
                              onClick={handleCameraCapture}
                              disabled={submitting}
                            >
                              <Camera size={24} />
                              <span>Take Photo</span>
                            </button>
                            <button
                              type="button"
                              className="upload-btn gallery"
                              onClick={handleFileUpload}
                              disabled={submitting}
                            >
                              <Upload size={24} />
                              <span>Upload from Gallery</span>
                            </button>
                          </div>
                          <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoSelect}
                            style={{ display: 'none' }}
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            style={{ display: 'none' }}
                          />
                        </div>
                      ) : (
                        <div className="photo-preview-container">
                          <img src={photoPreview} alt="Waste collection proof" className="photo-preview" />
                          <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={removePhoto}
                            disabled={submitting}
                          >
                            <X size={16} />
                            Remove Photo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actual Weight */}
                    <div className="form-group-complete">
                      <label>
                        <TrendingUp size={16} />
                        Actual Weight (kg)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter weight in kg"
                        value={actualWeight}
                        onChange={(e) => setActualWeight(e.target.value)}
                        min="0.1"
                        step="0.1"
                        required
                        disabled={submitting}
                      />
                      {selectedPickup.estimatedWeight > 0 && (
                        <small>Estimated: {selectedPickup.estimatedWeight} kg</small>
                      )}
                    </div>

                    {/* Additional Notes */}
                    <div className="form-group-complete">
                      <label>
                        <FileText size={16} />
                        Notes (Optional)
                      </label>
                      <textarea
                        placeholder="Any additional notes or observations..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="3"
                        disabled={submitting}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="submit-complete-btn"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader size={18} className="btn-spinner" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Complete Pickup
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletePickup;