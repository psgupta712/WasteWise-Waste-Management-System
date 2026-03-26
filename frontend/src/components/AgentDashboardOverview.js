import React, { useState, useEffect } from 'react';
import { 
  Package, CheckCircle, Clock, DollarSign, 
  TrendingUp, MapPin, Navigation, Star,
  Calendar, Users, Award, Target
} from 'lucide-react';
import './AgentDashboardOverview.css';

const AgentDashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAssigned: 0,
    todayCompleted: 0,
    todayPending: 0,
    todayEarnings: 0,
    weeklyCompleted: 0,
    monthlyCompleted: 0,
    averageRating: 0,
    totalEarnings: 0
  });
  const [todayPickups, setTodayPickups] = useState([]);
  const [agentInfo, setAgentInfo] = useState({
    name: 'Agent',
    rating: 0,
    totalPickups: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch agent's assigned pickups
      const response = await fetch('http://localhost:5000/api/pickup/my-pickups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const pickups = data.data || [];
        
        // Filter today's pickups
        const today = new Date().toDateString();
        const todaysPickups = pickups.filter(pickup => 
          new Date(pickup.pickupDate).toDateString() === today
        );

        setTodayPickups(todaysPickups);

        // Calculate stats
        const todayCompleted = todaysPickups.filter(p => p.status === 'completed').length;
        const todayPending = todaysPickups.filter(p => 
          p.status === 'scheduled' || p.status === 'confirmed' || p.status === 'in-progress'
        ).length;

        // Calculate earnings (₹50 per completed pickup as example)
        const todayEarnings = todayCompleted * 50;
        const totalCompleted = pickups.filter(p => p.status === 'completed').length;
        const totalEarnings = totalCompleted * 50;

        // Calculate average rating
        const ratedPickups = pickups.filter(p => p.rating > 0);
        const avgRating = ratedPickups.length > 0
          ? (ratedPickups.reduce((sum, p) => sum + p.rating, 0) / ratedPickups.length).toFixed(1)
          : 0;

        setStats({
          todayAssigned: todaysPickups.length,
          todayCompleted,
          todayPending,
          todayEarnings,
          weeklyCompleted: totalCompleted, // Would need date filtering for actual weekly
          monthlyCompleted: totalCompleted,
          averageRating: avgRating,
          totalEarnings
        });

        setAgentInfo({
          name: localStorage.getItem('userName') || 'Agent',
          rating: avgRating,
          totalPickups: totalCompleted
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSlotDisplay = (slot) => {
    const slots = {
      morning: '6-10 AM',
      afternoon: '10 AM-2 PM',
      evening: '2-6 PM'
    };
    return slots[slot] || slot;
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
    const colors = {
      scheduled: '#ff9800',
      confirmed: '#2196f3',
      'in-progress': '#9c27b0',
      completed: '#4caf50',
      cancelled: '#f44336'
    };
    return colors[status] || '#999';
  };

  if (loading) {
    return (
      <div className="loading-container-agent">
        <div className="spinner-large-agent"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="agent-dashboard-overview">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h2 className="welcome-title">
            Welcome back, <span className="agent-name">{agentInfo.name}</span>! 👋
          </h2>
          <p className="welcome-subtitle">
            {stats.todayPending > 0 
              ? `You have ${stats.todayPending} pickup${stats.todayPending > 1 ? 's' : ''} pending today`
              : 'No pending pickups for today. Great job!'}
          </p>
        </div>
        <div className="agent-quick-info">
          <div className="agent-rating-badge">
            <Star size={20} fill="#ffc107" stroke="#ffc107" />
            <span>{agentInfo.rating}</span>
          </div>
          <div className="agent-total-pickups">
            <Award size={20} />
            <span>{agentInfo.totalPickups} Completed</span>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="stats-grid-agent">
        <div className="stat-card-agent assigned">
          <div className="stat-card-header">
            <div className="stat-icon-circle assigned">
              <Package size={24} />
            </div>
            <div className="stat-trend up">
              <TrendingUp size={16} />
              <span>Today</span>
            </div>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-value">{stats.todayAssigned}</h3>
            <p className="stat-label">Assigned Pickups</p>
          </div>
          <div className="stat-card-footer">
            <div className="stat-progress-bar">
              <div 
                className="stat-progress-fill assigned"
                style={{ width: `${stats.todayAssigned > 0 ? (stats.todayCompleted / stats.todayAssigned * 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="stat-card-agent completed">
          <div className="stat-card-header">
            <div className="stat-icon-circle completed">
              <CheckCircle size={24} />
            </div>
            <div className="stat-trend up">
              <TrendingUp size={16} />
              <span>+{stats.todayCompleted}</span>
            </div>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-value">{stats.todayCompleted}</h3>
            <p className="stat-label">Completed Today</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-footer-text">
              {stats.todayAssigned > 0 
                ? `${Math.round(stats.todayCompleted / stats.todayAssigned * 100)}% completion rate`
                : 'No pickups today'}
            </span>
          </div>
        </div>

        <div className="stat-card-agent pending">
          <div className="stat-card-header">
            <div className="stat-icon-circle pending">
              <Clock size={24} />
            </div>
            <div className="stat-trend neutral">
              <Target size={16} />
              <span>Remaining</span>
            </div>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-value">{stats.todayPending}</h3>
            <p className="stat-label">Pending Pickups</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-footer-text">
              {stats.todayPending > 0 ? 'Get started!' : 'All done! 🎉'}
            </span>
          </div>
        </div>

        <div className="stat-card-agent earnings">
          <div className="stat-card-header">
            <div className="stat-icon-circle earnings">
              <DollarSign size={24} />
            </div>
            <div className="stat-trend up">
              <TrendingUp size={16} />
              <span>+₹{stats.todayEarnings}</span>
            </div>
          </div>
          <div className="stat-card-body">
            <h3 className="stat-value">₹{stats.todayEarnings}</h3>
            <p className="stat-label">Today's Earnings</p>
          </div>
          <div className="stat-card-footer">
            <span className="stat-footer-text">
              Total: ₹{stats.totalEarnings}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Schedule Section */}
      <div className="schedule-section">
        <div className="section-header">
          <div className="section-title-group">
            <Calendar size={24} />
            <h3>Today's Schedule</h3>
          </div>
          <button className="view-all-btn">
            View All <Navigation size={16} />
          </button>
        </div>

        {todayPickups.length === 0 ? (
          <div className="empty-schedule">
            <div className="empty-icon">📅</div>
            <h4>No pickups scheduled for today</h4>
            <p>Check back tomorrow or view all assignments</p>
          </div>
        ) : (
          <div className="schedule-timeline">
            {todayPickups.slice(0, 5).map((pickup, index) => (
              <div key={pickup._id} className="timeline-item">
                <div className="timeline-marker">
                  <div 
                    className="timeline-dot"
                    style={{ background: getStatusColor(pickup.status) }}
                  >
                    {index + 1}
                  </div>
                  {index < Math.min(todayPickups.length - 1, 4) && (
                    <div className="timeline-line"></div>
                  )}
                </div>

                <div className="timeline-content">
                  <div className="pickup-timeline-card">
                    <div className="pickup-timeline-header">
                      <div className="pickup-type-badge">
                        <span className="waste-icon-timeline">
                          {getWasteIcon(pickup.wasteType)}
                        </span>
                        <span>{pickup.wasteType}</span>
                      </div>
                      <div 
                        className="pickup-status-badge"
                        style={{ 
                          background: `${getStatusColor(pickup.status)}20`,
                          color: getStatusColor(pickup.status)
                        }}
                      >
                        {pickup.status}
                      </div>
                    </div>

                    <div className="pickup-timeline-details">
                      <div className="detail-item-timeline">
                        <Clock size={14} />
                        <span>{getTimeSlotDisplay(pickup.timeSlot)}</span>
                      </div>
                      <div className="detail-item-timeline">
                        <MapPin size={14} />
                        <span>{pickup.address.substring(0, 50)}...</span>
                      </div>
                      {pickup.estimatedWeight > 0 && (
                        <div className="detail-item-timeline">
                          <Package size={14} />
                          <span>~{pickup.estimatedWeight} kg</span>
                        </div>
                      )}
                    </div>

                    {pickup.status === 'scheduled' || pickup.status === 'confirmed' ? (
                      <div className="pickup-timeline-actions">
                        <button className="action-btn-timeline start">
                          <Navigation size={14} />
                          Navigate
                        </button>
                        <button className="action-btn-timeline primary">
                          <CheckCircle size={14} />
                          Start Pickup
                        </button>
                      </div>
                    ) : pickup.status === 'in-progress' ? (
                      <div className="pickup-timeline-actions">
                        <button className="action-btn-timeline complete">
                          <CheckCircle size={14} />
                          Complete
                        </button>
                      </div>
                    ) : (
                      <div className="completed-indicator">
                        <CheckCircle size={16} />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Overview */}
      <div className="performance-grid">
        <div className="performance-card">
          <div className="performance-header">
            <div className="performance-icon weekly">
              <TrendingUp size={24} />
            </div>
            <div>
              <h4>Weekly Performance</h4>
              <p className="performance-subtitle">Last 7 days</p>
            </div>
          </div>
          <div className="performance-value">{stats.weeklyCompleted}</div>
          <div className="performance-label">Pickups Completed</div>
          <div className="performance-bar">
            <div className="performance-bar-fill weekly" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="performance-card">
          <div className="performance-header">
            <div className="performance-icon rating">
              <Star size={24} />
            </div>
            <div>
              <h4>Average Rating</h4>
              <p className="performance-subtitle">Customer feedback</p>
            </div>
          </div>
          <div className="performance-value">{stats.averageRating} ⭐</div>
          <div className="performance-label">Out of 5.0</div>
          <div className="performance-bar">
            <div 
              className="performance-bar-fill rating" 
              style={{ width: `${stats.averageRating * 20}%` }}
            ></div>
          </div>
        </div>

        <div className="performance-card">
          <div className="performance-header">
            <div className="performance-icon monthly">
              <Award size={24} />
            </div>
            <div>
              <h4>Monthly Target</h4>
              <p className="performance-subtitle">This month</p>
            </div>
          </div>
          <div className="performance-value">{stats.monthlyCompleted}/100</div>
          <div className="performance-label">Pickups Completed</div>
          <div className="performance-bar">
            <div 
              className="performance-bar-fill monthly" 
              style={{ width: `${Math.min(stats.monthlyCompleted, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3 className="section-title-simple">Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-card">
            <div className="quick-action-icon route">
              <MapPin size={24} />
            </div>
            <h4>View Route</h4>
            <p>See optimized route</p>
          </button>

          <button className="quick-action-card">
            <div className="quick-action-icon pickups">
              <Package size={24} />
            </div>
            <h4>All Pickups</h4>
            <p>View all assigned</p>
          </button>

          <button className="quick-action-card">
            <div className="quick-action-icon earnings">
              <DollarSign size={24} />
            </div>
            <h4>Earnings</h4>
            <p>Track your income</p>
          </button>

          <button className="quick-action-card">
            <div className="quick-action-icon profile">
              <Users size={24} />
            </div>
            <h4>Profile</h4>
            <p>Update details</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboardOverview;