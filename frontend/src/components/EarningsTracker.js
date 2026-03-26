import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Calendar, Download, Award,
  Package, CheckCircle, Clock, Filter, ChevronDown,
  ChevronUp, RefreshCw, CreditCard, Wallet, Target,
  ArrowUpRight, ArrowDownRight, Eye, X
} from 'lucide-react';
import './EarningsTracker.css';

const EarningsTracker = () => {
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'today', 'week', 'month', 'all'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Earnings data
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
    pending: 0,
    paid: 0
  });

  // Breakdown data
  const [breakdown, setBreakdown] = useState({
    byWasteType: {},
    byDay: [],
    byMonth: []
  });

  const [stats, setStats] = useState({
    totalPickups: 0,
    avgPerPickup: 0,
    bestDay: { date: '', amount: 0 },
    bestMonth: { month: '', amount: 0 }
  });

  useEffect(() => {
    fetchEarningsData();
  }, []);

  useEffect(() => {
    if (pickups.length > 0) {
      calculateEarnings();
      calculateBreakdown();
      calculateStats();
    }
  }, [pickups, selectedPeriod, selectedMonth, selectedYear]);

  const fetchEarningsData = async () => {
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
        const completedPickups = (data.data || []).filter(p => p.status === 'completed');
        setPickups(completedPickups);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayPickups = pickups.filter(p => 
      new Date(p.pickupDate) >= today
    );
    const weekPickups = pickups.filter(p => 
      new Date(p.pickupDate) >= weekAgo
    );
    const monthPickups = pickups.filter(p => 
      new Date(p.pickupDate) >= monthStart
    );

    setEarnings({
      today: todayPickups.length * 50,
      week: weekPickups.length * 50,
      month: monthPickups.length * 50,
      total: pickups.length * 50,
      pending: 0, // In real app, calculate based on payment status
      paid: pickups.length * 50
    });
  };

  const calculateBreakdown = () => {
    // By waste type
    const byWasteType = {};
    pickups.forEach(p => {
      byWasteType[p.wasteType] = (byWasteType[p.wasteType] || 0) + 50;
    });

    // By day (last 30 days)
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayPickups = pickups.filter(p => 
        new Date(p.pickupDate).toISOString().split('T')[0] === dateStr
      );
      
      last30Days.push({
        date: dateStr,
        amount: dayPickups.length * 50,
        pickups: dayPickups.length
      });
    }

    // By month (last 12 months)
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthPickups = pickups.filter(p => {
        const pickupDate = new Date(p.pickupDate);
        return pickupDate.getMonth() === month && pickupDate.getFullYear() === year;
      });
      
      last12Months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: monthPickups.length * 50,
        pickups: monthPickups.length
      });
    }

    setBreakdown({
      byWasteType,
      byDay: last30Days,
      byMonth: last12Months
    });
  };

  const calculateStats = () => {
    if (pickups.length === 0) return;

    const avgPerPickup = (pickups.length * 50) / pickups.length;

    // Find best day
    const dayEarnings = {};
    pickups.forEach(p => {
      const date = new Date(p.pickupDate).toISOString().split('T')[0];
      dayEarnings[date] = (dayEarnings[date] || 0) + 50;
    });
    const bestDay = Object.entries(dayEarnings).reduce((a, b) => 
      b[1] > a[1] ? b : a, ['', 0]
    );

    // Find best month
    const monthEarnings = {};
    pickups.forEach(p => {
      const date = new Date(p.pickupDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthEarnings[monthKey] = (monthEarnings[monthKey] || 0) + 50;
    });
    const bestMonthEntry = Object.entries(monthEarnings).reduce((a, b) => 
      b[1] > a[1] ? b : a, ['', 0]
    );
    const bestMonthDate = new Date(bestMonthEntry[0].split('-')[0], bestMonthEntry[0].split('-')[1]);

    setStats({
      totalPickups: pickups.length,
      avgPerPickup: avgPerPickup.toFixed(0),
      bestDay: {
        date: new Date(bestDay[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: bestDay[1]
      },
      bestMonth: {
        month: bestMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: bestMonthEntry[1]
      }
    });
  };

  const exportEarningsReport = () => {
    const headers = ['Date', 'Waste Type', 'Amount', 'Status'];
    const rows = pickups.map(p => [
      new Date(p.pickupDate).toLocaleDateString(),
      p.wasteType,
      '₹50',
      'Paid'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getPeriodEarnings = () => {
    switch (selectedPeriod) {
      case 'today': return earnings.today;
      case 'week': return earnings.week;
      case 'month': return earnings.month;
      case 'all': return earnings.total;
      default: return earnings.month;
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

  if (loading) {
    return (
      <div className="earnings-loading">
        <DollarSign size={48} className="spinner-earnings" />
        <p>Loading earnings data...</p>
      </div>
    );
  }

  return (
    <div className="earnings-tracker-container">
      {/* Header */}
      <div className="earnings-header">
        <div className="header-title-section">
          <h2>Earnings Tracker</h2>
          <p>Track your income and financial performance</p>
        </div>
        <div className="header-actions-earnings">
          <button className="export-earnings-btn" onClick={exportEarningsReport}>
            <Download size={18} />
            Export Report
          </button>
          <button className="refresh-earnings-btn" onClick={fetchEarningsData}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="period-selector">
        {['today', 'week', 'month', 'all'].map((period) => (
          <button
            key={period}
            className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
            onClick={() => setSelectedPeriod(period)}
          >
            {period === 'today' && <Clock size={16} />}
            {period === 'week' && <Calendar size={16} />}
            {period === 'month' && <Calendar size={16} />}
            {period === 'all' && <Target size={16} />}
            <span>{period.charAt(0).toUpperCase() + period.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* Main Earnings Display */}
      <div className="main-earnings-card">
        <div className="earnings-icon-large">
          <Wallet size={48} />
        </div>
        <div className="earnings-amount-section">
          <span className="earnings-label">
            {selectedPeriod === 'today' && "Today's Earnings"}
            {selectedPeriod === 'week' && "This Week"}
            {selectedPeriod === 'month' && "This Month"}
            {selectedPeriod === 'all' && "Total Earnings"}
          </span>
          <h1 className="earnings-amount">₹{getPeriodEarnings()}</h1>
          {selectedPeriod !== 'all' && (
            <div className="earnings-growth">
              <ArrowUpRight size={20} />
              <span>Track your daily progress</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="earnings-stats-grid">
        <div className="earnings-stat-card pending">
          <div className="stat-card-header-earnings">
            <div className="stat-icon-earnings">
              <Clock size={24} />
            </div>
            <span className="stat-trend-earnings up">
              <TrendingUp size={14} />
            </span>
          </div>
          <h3 className="stat-value-earnings">₹{earnings.pending}</h3>
          <p className="stat-label-earnings">Pending Payment</p>
        </div>

        <div className="earnings-stat-card paid">
          <div className="stat-card-header-earnings">
            <div className="stat-icon-earnings">
              <CheckCircle size={24} />
            </div>
            <span className="stat-trend-earnings up">
              <TrendingUp size={14} />
            </span>
          </div>
          <h3 className="stat-value-earnings">₹{earnings.paid}</h3>
          <p className="stat-label-earnings">Total Paid</p>
        </div>

        <div className="earnings-stat-card pickups">
          <div className="stat-card-header-earnings">
            <div className="stat-icon-earnings">
              <Package size={24} />
            </div>
            <span className="stat-trend-earnings neutral">
              {stats.totalPickups}
            </span>
          </div>
          <h3 className="stat-value-earnings">₹{stats.avgPerPickup}</h3>
          <p className="stat-label-earnings">Avg Per Pickup</p>
        </div>

        <div className="earnings-stat-card best">
          <div className="stat-card-header-earnings">
            <div className="stat-icon-earnings">
              <Award size={24} />
            </div>
            <span className="stat-trend-earnings up">
              <TrendingUp size={14} />
            </span>
          </div>
          <h3 className="stat-value-earnings">₹{stats.bestDay.amount}</h3>
          <p className="stat-label-earnings">Best Day ({stats.bestDay.date})</p>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="earnings-breakdown-section">
        <h3 className="section-title-earnings">Earnings Breakdown</h3>

        {/* By Waste Type */}
        <div className="breakdown-card">
          <h4>By Waste Type</h4>
          <div className="waste-type-breakdown">
            {Object.entries(breakdown.byWasteType).map(([type, amount]) => (
              <div key={type} className="waste-type-item">
                <div className="waste-type-info">
                  <span className="waste-icon-earnings">{getWasteIcon(type)}</span>
                  <span className="waste-type-name">{type}</span>
                </div>
                <div className="waste-type-amount">
                  <span className="amount-value">₹{amount}</span>
                  <div className="progress-bar-earnings">
                    <div 
                      className="progress-fill-earnings"
                      style={{ width: `${(amount / earnings.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Trend (Last 7 Days) */}
        <div className="breakdown-card">
          <h4>Daily Earnings (Last 7 Days)</h4>
          <div className="daily-trend-chart">
            {breakdown.byDay.slice(-7).map((day, index) => (
              <div key={index} className="chart-bar-container">
                <div className="chart-bar-wrapper">
                  <div 
                    className="chart-bar"
                    style={{ 
                      height: `${Math.max((day.amount / Math.max(...breakdown.byDay.slice(-7).map(d => d.amount))) * 100, 5)}%` 
                    }}
                  >
                    <span className="bar-value">₹{day.amount}</span>
                  </div>
                </div>
                <span className="chart-label">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend (Last 6 Months) */}
        <div className="breakdown-card">
          <h4>Monthly Earnings (Last 6 Months)</h4>
          <div className="monthly-trend-list">
            {breakdown.byMonth.slice(-6).map((month, index) => (
              <div key={index} className="month-item">
                <div className="month-info">
                  <Calendar size={16} />
                  <span className="month-name">{month.month}</span>
                </div>
                <div className="month-stats">
                  <span className="month-pickups">{month.pickups} pickups</span>
                  <span className="month-amount">₹{month.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="recent-transactions-section">
        <div className="section-header-earnings">
          <h3 className="section-title-earnings">Recent Transactions</h3>
          <span className="transaction-count">{pickups.slice(0, 10).length} transactions</span>
        </div>

        <div className="transactions-list">
          {pickups.slice(0, 10).map((pickup) => (
            <div key={pickup._id} className="transaction-item">
              <div className="transaction-icon-wrapper">
                <CheckCircle size={20} />
              </div>
              <div className="transaction-details">
                <h5>{pickup.wasteType}</h5>
                <p>{new Date(pickup.pickupDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}</p>
              </div>
              <div className="transaction-amount-positive">
                +₹50
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Info Card */}
      <div className="payment-info-card">
        <div className="payment-icon-large">
          <CreditCard size={32} />
        </div>
        <div className="payment-info-content">
          <h4>Payment Information</h4>
          <p>Your earnings are automatically transferred to your registered bank account on the 1st of every month.</p>
          <button className="update-payment-btn">
            <CreditCard size={16} />
            Update Payment Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default EarningsTracker;