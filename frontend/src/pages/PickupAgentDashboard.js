
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentDashboardOverview from '../components/AgentDashboardOverview';
import MyRoutes from '../components/MyRoutes';
import AssignedPickups from '../components/AssignedPickups';
import CompletePickup from '../components/CompletePickup';
import PickupHistory from '../components/PickupHistory';
import EarningsTracker from '../components/EarningsTracker';
import ProfileSettings from '../components/ProfileSettings';
import PerformanceDashboard from '../components/PerformanceDashboard';
import { 
  Home, MapPin, Package, CheckCircle, History, 
  DollarSign, Star, User, Bell, HelpCircle, 
  LogOut, Menu, X, Power, Navigation
} from 'lucide-react';
import './PickupAgentDashboard.css';

const PickupAgentDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentStatus, setAgentStatus] = useState('active'); // active, on_break, offline
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const toggleStatus = () => {
    const statusOrder = ['active', 'on_break', 'offline'];
    const currentIndex = statusOrder.indexOf(agentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    setAgentStatus(statusOrder[nextIndex]);
  };

  const getStatusConfig = () => {
    const configs = {
      active: { 
        label: 'Active', 
        color: '#4caf50', 
        icon: '🟢',
        bgColor: '#e8f5e9' 
      },
      on_break: { 
        label: 'On Break', 
        color: '#ff9800', 
        icon: '🟡',
        bgColor: '#fff3e0' 
      },
      offline: { 
        label: 'Offline', 
        color: '#f44336', 
        icon: '🔴',
        bgColor: '#ffebee' 
      }
    };
    return configs[agentStatus];
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'routes', label: 'My Routes', icon: MapPin },
    { id: 'pickups', label: 'Assigned Pickups', icon: Package },
    { id: 'complete', label: 'Complete Pickup', icon: CheckCircle },
    { id: 'history', label: 'History', icon: History },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: Star },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <AgentDashboardOverview />
        );
      case 'routes':
        return (
          <MyRoutes />
        );
      case 'pickups':
        return (
          <AssignedPickups />
        );
      case 'complete':
        return (
          <CompletePickup />
        );
      case 'history':
        return (
          <PickupHistory />
        );
      case 'earnings':
        return (
          <EarningsTracker />
        );
      case 'performance':
        return (
          <PerformanceDashboard />
        );
      case 'profile':
        return (
          <ProfileSettings />
        );
      default:
        return (
          <AgentDashboardOverview />
        );
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="agent-dashboard-container">
      {/* Sidebar */}
      <aside 
        className={`agent-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="agent-sidebar-header">
          <div className="agent-logo-section">
            <div className="agent-logo-icon">🚛</div>
            {sidebarOpen && <h1 className="agent-logo-text">WasteWise Agent</h1>}
          </div>
        </div>

        {/* Status Toggle */}
        {sidebarOpen && (
          <div className="agent-status-card">
            <div className="agent-status-header">
              <span className="status-label">Your Status</span>
              <button 
                className="status-toggle-btn"
                onClick={toggleStatus}
                style={{ color: statusConfig.color }}
              >
                <Power size={16} />
              </button>
            </div>
            <button 
              className="agent-status-button"
              onClick={toggleStatus}
              style={{ 
                background: statusConfig.bgColor,
                borderColor: statusConfig.color 
              }}
            >
              <span className="status-icon">{statusConfig.icon}</span>
              <span style={{ color: statusConfig.color }}>{statusConfig.label}</span>
            </button>
          </div>
        )}

        <nav className="agent-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`agent-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="agent-sidebar-footer">
          <button className="agent-nav-item" onClick={() => setActiveTab('notifications')}>
            <Bell size={20} />
            {sidebarOpen && <span>Notifications</span>}
            {sidebarOpen && <span className="agent-notif-badge">3</span>}
          </button>

          <button className="agent-nav-item" onClick={() => setActiveTab('help')}>
            <HelpCircle size={20} />
            {sidebarOpen && <span>Help & Support</span>}
          </button>

          <button className="agent-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`agent-main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="agent-dashboard-header">
          <div className="agent-header-left">
            <h2 className="agent-page-title">
              {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <p className="agent-page-subtitle">
              Manage your pickups efficiently 🚛
            </p>
          </div>

          <div className="agent-header-right">
            {/* Quick Stats */}
            <div className="agent-quick-stats">
              <div className="agent-quick-stat">
                <Package size={18} />
                <span className="stat-number">5</span>
                <span className="stat-label">Today</span>
              </div>
              <div className="agent-quick-stat completed">
                <CheckCircle size={18} />
                <span className="stat-number">2</span>
                <span className="stat-label">Done</span>
              </div>
            </div>

            {/* Live Location Button */}
            <button className="agent-location-btn">
              <Navigation size={18} />
              <span>Live Location</span>
            </button>

            {/* Status Indicator (Mobile) */}
            <div 
              className="agent-status-indicator"
              onClick={toggleStatus}
              style={{ background: statusConfig.color }}
              title={statusConfig.label}
            >
              {statusConfig.icon}
            </div>

            {/* Profile Icon */}
            <div className="agent-profile-icon">
              <User size={20} />
            </div>
          </div>
        </header>

        <div className="agent-content-area">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default PickupAgentDashboard;