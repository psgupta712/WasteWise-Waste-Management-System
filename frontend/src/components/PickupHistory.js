import React, { useState, useEffect } from 'react';
import { 
  History, Calendar, Search, Filter, Download, TrendingUp,
  Package, MapPin, Clock, User, Star, CheckCircle, XCircle,
  Phone, FileText, ChevronDown, ChevronUp, Eye, X,
  RefreshCw, Award, DollarSign
} from 'lucide-react';
import './PickupHistory.css';

const PickupHistory = () => {
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState([]);
  const [filteredPickups, setFilteredPickups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Stats
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalCancelled: 0,
    totalEarnings: 0,
    totalWeight: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pickups, searchQuery, statusFilter, monthFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/pickup/my-pickups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allPickups = data.data || [];
        
        // Filter only completed and cancelled pickups
        const historyPickups = allPickups.filter(p => 
          p.status === 'completed' || p.status === 'cancelled'
        );
        
        setPickups(historyPickups);
        calculateStats(historyPickups);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (pickupList) => {
    const completed = pickupList.filter(p => p.status === 'completed');
    const cancelled = pickupList.filter(p => p.status === 'cancelled');
    
    const totalEarnings = completed.length * 50; // ₹50 per pickup
    const totalWeight = completed.reduce((sum, p) => sum + (p.actualWeight || p.estimatedWeight || 0), 0);
    
    const ratedPickups = completed.filter(p => p.rating > 0);
    const avgRating = ratedPickups.length > 0
      ? (ratedPickups.reduce((sum, p) => sum + p.rating, 0) / ratedPickups.length).toFixed(1)
      : 0;

    setStats({
      totalCompleted: completed.length,
      totalCancelled: cancelled.length,
      totalEarnings,
      totalWeight: totalWeight.toFixed(1),
      averageRating: avgRating
    });
  };

  const applyFilters = () => {
    let filtered = [...pickups];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.wasteType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Month filter
    if (monthFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date(now.getFullYear(), parseInt(monthFilter), 1);
      const nextMonth = new Date(now.getFullYear(), parseInt(monthFilter) + 1, 1);
      
      filtered = filtered.filter(p => {
        const pickupDate = new Date(p.pickupDate);
        return pickupDate >= filterDate && pickupDate < nextMonth;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate));

    setFilteredPickups(filtered);
    setCurrentPage(1);
  };

  const handleViewDetails = (pickup) => {
    setSelectedPickup(pickup);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPickup(null);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Waste Type', 'Address', 'Weight (kg)', 'Status', 'Earnings', 'Rating'];
    const rows = filteredPickups.map(p => [
      formatDate(p.pickupDate),
      p.wasteType,
      p.address,
      p.actualWeight || p.estimatedWeight || 0,
      p.status,
      p.status === 'completed' ? '₹50' : '₹0',
      p.rating || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pickup-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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

  const getStatusColor = (status) => {
    return status === 'completed' ? '#4caf50' : '#f44336';
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPickups = filteredPickups.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPickups.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="history-loading">
        <History size={48} className="spinner-history" />
        <p>Loading pickup history...</p>
      </div>
    );
  }

  return (
    <div className="pickup-history-container">
      {/* Header */}
      <div className="history-header">
        <div className="header-title-section">
          <h2>Pickup History</h2>
          <p>View all your past pickups and earnings</p>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={exportToCSV}>
            <Download size={18} />
            Export CSV
          </button>
          <button className="refresh-btn-history" onClick={fetchHistory}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="history-stats-grid">
        <div className="history-stat-card completed">
          <div className="stat-icon-history">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content-history">
            <span className="stat-value-history">{stats.totalCompleted}</span>
            <span className="stat-label-history">Completed</span>
          </div>
        </div>

        <div className="history-stat-card cancelled">
          <div className="stat-icon-history">
            <XCircle size={24} />
          </div>
          <div className="stat-content-history">
            <span className="stat-value-history">{stats.totalCancelled}</span>
            <span className="stat-label-history">Cancelled</span>
          </div>
        </div>

        <div className="history-stat-card earnings">
          <div className="stat-icon-history">
            <DollarSign size={24} />
          </div>
          <div className="stat-content-history">
            <span className="stat-value-history">₹{stats.totalEarnings}</span>
            <span className="stat-label-history">Total Earnings</span>
          </div>
        </div>

        <div className="history-stat-card weight">
          <div className="stat-icon-history">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content-history">
            <span className="stat-value-history">{stats.totalWeight} kg</span>
            <span className="stat-label-history">Total Weight</span>
          </div>
        </div>

        <div className="history-stat-card rating">
          <div className="stat-icon-history">
            <Star size={24} />
          </div>
          <div className="stat-content-history">
            <span className="stat-value-history">{stats.averageRating} ⭐</span>
            <span className="stat-label-history">Avg Rating</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="history-filters-bar">
        <div className="search-box-history">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by address, customer, or waste type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-history" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <button 
          className={`filters-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="history-filters-panel">
          <div className="filter-group-history">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group-history">
            <label>Month</label>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="all">All Months</option>
              <option value="0">January</option>
              <option value="1">February</option>
              <option value="2">March</option>
              <option value="3">April</option>
              <option value="4">May</option>
              <option value="5">June</option>
              <option value="6">July</option>
              <option value="7">August</option>
              <option value="8">September</option>
              <option value="9">October</option>
              <option value="10">November</option>
              <option value="11">December</option>
            </select>
          </div>

          <button 
            className="clear-filters-history-btn"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setMonthFilter('all');
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Results Info */}
      <div className="history-results-info">
        <p>
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPickups.length)} of {filteredPickups.length} pickups
        </p>
      </div>

      {/* History List */}
      {filteredPickups.length === 0 ? (
        <div className="no-history">
          <div className="empty-icon-history">📦</div>
          <h3>No pickup history found</h3>
          <p>Complete pickups to see them here</p>
        </div>
      ) : (
        <>
          <div className="history-list">
            {currentPickups.map((pickup) => (
              <div key={pickup._id} className="history-item">
                <div className="history-item-main">
                  <div className="history-item-icon">
                    <span>{getWasteIcon(pickup.wasteType)}</span>
                  </div>

                  <div className="history-item-details">
                    <div className="history-item-header">
                      <h4>{pickup.wasteType}</h4>
                      <span 
                        className="history-status-badge"
                        style={{ 
                          background: `${getStatusColor(pickup.status)}20`,
                          color: getStatusColor(pickup.status)
                        }}
                      >
                        {pickup.status}
                      </span>
                    </div>

                    <div className="history-item-info">
                      <div className="info-item-history">
                        <Calendar size={14} />
                        <span>{formatDate(pickup.pickupDate)}</span>
                      </div>
                      <div className="info-item-history">
                        <Clock size={14} />
                        <span>{getTimeSlotDisplay(pickup.timeSlot)}</span>
                      </div>
                      <div className="info-item-history">
                        <MapPin size={14} />
                        <span>{pickup.address.substring(0, 50)}...</span>
                      </div>
                      {pickup.user && (
                        <div className="info-item-history">
                          <User size={14} />
                          <span>{pickup.user.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="history-item-stats">
                    {pickup.actualWeight > 0 && (
                      <div className="history-stat-item">
                        <TrendingUp size={16} />
                        <span>{pickup.actualWeight} kg</span>
                      </div>
                    )}
                    {pickup.status === 'completed' && (
                      <div className="history-stat-item earnings-badge">
                        <Award size={16} />
                        <span>₹50</span>
                      </div>
                    )}
                    {pickup.rating > 0 && (
                      <div className="history-stat-item rating-badge">
                        <Star size={16} fill="#ffc107" stroke="#ffc107" />
                        <span>{pickup.rating}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewDetails(pickup)}
                  >
                    <Eye size={16} />
                    Details
                  </button>
                </div>

                {pickup.feedback && (
                  <div className="history-feedback">
                    <FileText size={14} />
                    <span>"{pickup.feedback}"</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-history">
              <button 
                className="page-btn-history"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <div className="page-numbers-history">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className={`page-number-history ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => paginate(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="page-ellipsis-history">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                className="page-btn-history"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPickup && (
        <div className="modal-overlay-history" onClick={closeDetailsModal}>
          <div className="modal-history-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-history">
              <h3>Pickup Details</h3>
              <button className="close-modal-history" onClick={closeDetailsModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-history">
              {/* Status and ID */}
              <div className="details-section">
                <div className="details-row">
                  <span className="details-label">Pickup ID:</span>
                  <span className="details-value">#{selectedPickup._id.slice(-8)}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Status:</span>
                  <span 
                    className="status-badge-details"
                    style={{ 
                      background: `${getStatusColor(selectedPickup.status)}20`,
                      color: getStatusColor(selectedPickup.status)
                    }}
                  >
                    {selectedPickup.status}
                  </span>
                </div>
              </div>

              {/* Waste Info */}
              <div className="details-section">
                <h4>Waste Information</h4>
                <div className="details-row">
                  <span className="details-label">Type:</span>
                  <span className="details-value">
                    {getWasteIcon(selectedPickup.wasteType)} {selectedPickup.wasteType}
                  </span>
                </div>
                <div className="details-row">
                  <span className="details-label">Estimated Weight:</span>
                  <span className="details-value">{selectedPickup.estimatedWeight || 0} kg</span>
                </div>
                {selectedPickup.actualWeight > 0 && (
                  <div className="details-row">
                    <span className="details-label">Actual Weight:</span>
                    <span className="details-value highlight">{selectedPickup.actualWeight} kg</span>
                  </div>
                )}
              </div>

              {/* Schedule Info */}
              <div className="details-section">
                <h4>Schedule Details</h4>
                <div className="details-row">
                  <span className="details-label">Date:</span>
                  <span className="details-value">{formatDate(selectedPickup.pickupDate)}</span>
                </div>
                <div className="details-row">
                  <span className="details-label">Time Slot:</span>
                  <span className="details-value">{getTimeSlotDisplay(selectedPickup.timeSlot)}</span>
                </div>
              </div>

              {/* Location Info */}
              <div className="details-section">
                <h4>Location</h4>
                <div className="details-row">
                  <span className="details-label">Address:</span>
                  <span className="details-value">{selectedPickup.address}</span>
                </div>
              </div>

              {/* Customer Info */}
              {selectedPickup.user && (
                <div className="details-section">
                  <h4>Customer Information</h4>
                  <div className="details-row">
                    <span className="details-label">Name:</span>
                    <span className="details-value">{selectedPickup.user.name}</span>
                  </div>
                  {selectedPickup.contactPhone && (
                    <div className="details-row">
                      <span className="details-label">Phone:</span>
                      <a href={`tel:${selectedPickup.contactPhone}`} className="details-link">
                        {selectedPickup.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Earnings & Rating */}
              {selectedPickup.status === 'completed' && (
                <div className="details-section">
                  <h4>Performance</h4>
                  <div className="details-row">
                    <span className="details-label">Earnings:</span>
                    <span className="details-value highlight">₹50</span>
                  </div>
                  {selectedPickup.rating > 0 && (
                    <div className="details-row">
                      <span className="details-label">Rating:</span>
                      <span className="details-value">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < selectedPickup.rating ? '#ffc107' : 'none'}
                            stroke={i < selectedPickup.rating ? '#ffc107' : '#ccc'}
                          />
                        ))}
                        <span style={{ marginLeft: '8px' }}>({selectedPickup.rating}/5)</span>
                      </span>
                    </div>
                  )}
                  {selectedPickup.feedback && (
                    <div className="details-row">
                      <span className="details-label">Feedback:</span>
                      <span className="details-value">"{selectedPickup.feedback}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupHistory;