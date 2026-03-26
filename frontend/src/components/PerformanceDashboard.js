import React, { useState, useEffect } from 'react';
import { 
  Star, Award, TrendingUp, Target, Trophy, Medal,
  Calendar, CheckCircle, Clock, ThumbsUp, MessageSquare,
  BarChart, PieChart, Activity, Zap, Crown, Gift,
  RefreshCw, Download,
  Package
} from 'lucide-react';
import './PerformanceDashboard.css';

const PerformanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState([]);
  const [performance, setPerformance] = useState({
    overallRating: 0,
    totalRatings: 0,
    completionRate: 0,
    onTimeRate: 0,
    responseTime: 0,
    customerSatisfaction: 0
  });

  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
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
        setPickups(allPickups);
        calculatePerformance(allPickups);
        calculateBadges(allPickups);
        calculateAchievements(allPickups);
        extractReviews(allPickups);
        calculateMonthlyStats(allPickups);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformance = (pickupList) => {
    const completed = pickupList.filter(p => p.status === 'completed');
    const rated = completed.filter(p => p.rating > 0);
    
    const avgRating = rated.length > 0
      ? (rated.reduce((sum, p) => sum + p.rating, 0) / rated.length).toFixed(1)
      : 0;

    const completionRate = pickupList.length > 0
      ? ((completed.length / pickupList.length) * 100).toFixed(1)
      : 0;

    const onTime = completed.length; // In real app, check actual vs scheduled time
    const onTimeRate = completed.length > 0
      ? ((onTime / completed.length) * 100).toFixed(1)
      : 0;

    const satisfaction = rated.filter(p => p.rating >= 4).length;
    const satisfactionRate = rated.length > 0
      ? ((satisfaction / rated.length) * 100).toFixed(1)
      : 0;

    setPerformance({
      overallRating: avgRating,
      totalRatings: rated.length,
      completionRate: completionRate,
      onTimeRate: onTimeRate,
      responseTime: 15, // Demo value in minutes
      customerSatisfaction: satisfactionRate
    });
  };

  const calculateBadges = (pickupList) => {
    const completed = pickupList.filter(p => p.status === 'completed');
    const badgeList = [];

    // Starter Badge
    if (completed.length >= 1) {
      badgeList.push({
        id: 1,
        name: 'First Pickup',
        icon: '🎯',
        description: 'Completed your first pickup',
        earned: true,
        date: completed[0]?.pickupDate
      });
    }

    // Regular Badge
    if (completed.length >= 10) {
      badgeList.push({
        id: 2,
        name: 'Regular Collector',
        icon: '📦',
        description: 'Completed 10 pickups',
        earned: true,
        date: completed[9]?.pickupDate
      });
    }

    // Professional Badge
    if (completed.length >= 50) {
      badgeList.push({
        id: 3,
        name: 'Professional',
        icon: '⭐',
        description: 'Completed 50 pickups',
        earned: true,
        date: completed[49]?.pickupDate
      });
    }

    // Expert Badge
    if (completed.length >= 100) {
      badgeList.push({
        id: 4,
        name: 'Expert Collector',
        icon: '🏆',
        description: 'Completed 100 pickups',
        earned: true,
        date: completed[99]?.pickupDate
      });
    }

    // 5-Star Badge
    const fiveStarCount = pickupList.filter(p => p.rating === 5).length;
    if (fiveStarCount >= 5) {
      badgeList.push({
        id: 5,
        name: '5-Star Agent',
        icon: '⭐⭐⭐⭐⭐',
        description: 'Received 5 five-star ratings',
        earned: true,
        date: new Date()
      });
    }

    // Consistency Badge
    if (completed.length >= 30) {
      badgeList.push({
        id: 6,
        name: 'Consistent Performer',
        icon: '🎖️',
        description: 'Completed pickups for 30 days',
        earned: true,
        date: new Date()
      });
    }

    setBadges(badgeList);
  };

  const calculateAchievements = (pickupList) => {
    const completed = pickupList.filter(p => p.status === 'completed');
    const achievementList = [
      {
        id: 1,
        title: 'Total Pickups',
        current: completed.length,
        target: 100,
        icon: <Package size={24} />,
        color: '#ff9800'
      },
      {
        id: 2,
        title: 'Customer Ratings',
        current: pickupList.filter(p => p.rating > 0).length,
        target: 50,
        icon: <Star size={24} />,
        color: '#ffc107'
      },
      {
        id: 3,
        title: '5-Star Reviews',
        current: pickupList.filter(p => p.rating === 5).length,
        target: 25,
        icon: <Trophy size={24} />,
        color: '#4caf50'
      },
      {
        id: 4,
        title: 'Waste Collected (kg)',
        current: completed.reduce((sum, p) => sum + (p.actualWeight || p.estimatedWeight || 0), 0),
        target: 500,
        icon: <TrendingUp size={24} />,
        color: '#2196f3'
      }
    ];

    setAchievements(achievementList);
  };

  const extractReviews = (pickupList) => {
    const reviewList = pickupList
      .filter(p => p.rating > 0 && p.feedback)
      .slice(0, 5)
      .map(p => ({
        id: p._id,
        rating: p.rating,
        feedback: p.feedback,
        date: p.pickupDate,
        wasteType: p.wasteType
      }));

    setReviews(reviewList);
  };

  const calculateMonthlyStats = (pickupList) => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthPickups = pickupList.filter(p => {
        const pickupDate = new Date(p.pickupDate);
        return pickupDate.getMonth() === month && 
               pickupDate.getFullYear() === year &&
               p.status === 'completed';
      });

      const monthRatings = monthPickups.filter(p => p.rating > 0);
      const avgRating = monthRatings.length > 0
        ? (monthRatings.reduce((sum, p) => sum + p.rating, 0) / monthRatings.length).toFixed(1)
        : 0;
      
      last6Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        pickups: monthPickups.length,
        rating: avgRating
      });
    }

    setMonthlyStats(last6Months);
  };

  if (loading) {
    return (
      <div className="performance-loading">
        <Activity size={48} className="spinner-performance" />
        <p>Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="performance-dashboard-container">
      {/* Header */}
      <div className="performance-header">
        <div className="header-title-section">
          <h2>Performance Dashboard</h2>
          <p>Track your ratings, badges, and achievements</p>
        </div>
        <button className="refresh-performance-btn" onClick={fetchPerformanceData}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Overall Rating Card */}
      <div className="overall-rating-card">
        <div className="rating-icon-large">
          <Crown size={64} />
        </div>
        <div className="rating-details">
          <div className="rating-stars-large">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={40}
                fill={star <= performance.overallRating ? '#ffc107' : 'none'}
                stroke={star <= performance.overallRating ? '#ffc107' : '#e0e0e0'}
              />
            ))}
          </div>
          <h1 className="overall-rating-value">{performance.overallRating}/5.0</h1>
          <p className="rating-subtitle">Based on {performance.totalRatings} customer ratings</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics-grid">
        <div className="metric-card completion">
          <div className="metric-icon">
            <CheckCircle size={32} />
          </div>
          <div className="metric-content">
            <h3>{performance.completionRate}%</h3>
            <p>Completion Rate</p>
            <div className="metric-progress">
              <div className="metric-progress-fill" style={{ width: `${performance.completionRate}%` }}></div>
            </div>
          </div>
        </div>

        <div className="metric-card ontime">
          <div className="metric-icon">
            <Clock size={32} />
          </div>
          <div className="metric-content">
            <h3>{performance.onTimeRate}%</h3>
            <p>On-Time Delivery</p>
            <div className="metric-progress">
              <div className="metric-progress-fill" style={{ width: `${performance.onTimeRate}%` }}></div>
            </div>
          </div>
        </div>

        <div className="metric-card response">
          <div className="metric-icon">
            <Zap size={32} />
          </div>
          <div className="metric-content">
            <h3>{performance.responseTime} min</h3>
            <p>Avg Response Time</p>
            <div className="metric-progress">
              <div className="metric-progress-fill" style={{ width: '80%' }}></div>
            </div>
          </div>
        </div>

        <div className="metric-card satisfaction">
          <div className="metric-icon">
            <ThumbsUp size={32} />
          </div>
          <div className="metric-content">
            <h3>{performance.customerSatisfaction}%</h3>
            <p>Customer Satisfaction</p>
            <div className="metric-progress">
              <div className="metric-progress-fill" style={{ width: `${performance.customerSatisfaction}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="badges-section">
        <h3 className="section-title-performance">
          <Award size={24} />
          Badges Earned ({badges.length})
        </h3>
        <div className="badges-grid">
          {badges.map((badge) => (
            <div key={badge.id} className="badge-card earned">
              <div className="badge-icon-large">{badge.icon}</div>
              <h4>{badge.name}</h4>
              <p>{badge.description}</p>
              <span className="badge-date">
                {new Date(badge.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          ))}
          
          {/* Locked Badges */}
          {badges.length < 6 && (
            <div className="badge-card locked">
              <div className="badge-icon-large">🔒</div>
              <h4>More to Unlock</h4>
              <p>Keep completing pickups to earn more badges!</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements Progress */}
      <div className="achievements-section">
        <h3 className="section-title-performance">
          <Target size={24} />
          Achievements Progress
        </h3>
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="achievement-card">
              <div className="achievement-header">
                <div className="achievement-icon" style={{ color: achievement.color }}>
                  {achievement.icon}
                </div>
                <div className="achievement-info">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.current} / {achievement.target}</p>
                </div>
              </div>
              <div className="achievement-progress-bar">
                <div 
                  className="achievement-progress-fill"
                  style={{ 
                    width: `${Math.min((achievement.current / achievement.target) * 100, 100)}%`,
                    background: achievement.color
                  }}
                ></div>
              </div>
              <span className="achievement-percentage">
                {Math.min(Math.round((achievement.current / achievement.target) * 100), 100)}% Complete
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Performance Chart */}
      <div className="monthly-performance-section">
        <h3 className="section-title-performance">
          <BarChart size={24} />
          Monthly Performance (Last 6 Months)
        </h3>
        <div className="monthly-chart">
          {monthlyStats.map((month, index) => (
            <div key={index} className="month-chart-item">
              <div className="month-chart-bars">
                <div className="chart-bar-wrapper-performance">
                  <div 
                    className="chart-bar-performance pickups"
                    style={{ height: `${(month.pickups / 20) * 100}%` }}
                    title={`${month.pickups} pickups`}
                  >
                    <span className="bar-label">{month.pickups}</span>
                  </div>
                </div>
                <div className="chart-bar-wrapper-performance">
                  <div 
                    className="chart-bar-performance rating"
                    style={{ height: `${(month.rating / 5) * 100}%` }}
                    title={`${month.rating} rating`}
                  >
                    <span className="bar-label">{month.rating}</span>
                  </div>
                </div>
              </div>
              <span className="month-label">{month.month}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color pickups"></div>
            <span>Pickups</span>
          </div>
          <div className="legend-item">
            <div className="legend-color rating"></div>
            <span>Rating</span>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="reviews-section">
        <h3 className="section-title-performance">
          <MessageSquare size={24} />
          Recent Customer Reviews
        </h3>
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <MessageSquare size={48} />
            <p>No reviews yet. Complete more pickups to receive feedback!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= review.rating ? '#ffc107' : 'none'}
                        stroke={star <= review.rating ? '#ffc107' : '#e0e0e0'}
                      />
                    ))}
                  </div>
                  <span className="review-date">
                    {new Date(review.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <p className="review-feedback">"{review.feedback}"</p>
                <span className="review-type">{review.wasteType}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;