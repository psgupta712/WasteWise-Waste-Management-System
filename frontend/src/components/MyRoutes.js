import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Map, List, Navigation, MapPin, Package, Clock, 
  Filter, Phone, CheckCircle, Navigation2, Target,
  TrendingUp, Loader, AlertCircle, ExternalLink
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './MyRoutes.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icons
const createCustomIcon = (color, icon) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">${icon}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

// Map center adjuster component
const MapCenterAdjuster = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const MyRoutes = () => {
  const [view, setView] = useState('map'); // 'map' or 'list'
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState([]);
  const [filteredPickups, setFilteredPickups] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([30.9010, 75.8573]); // Ludhiana, Punjab
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [routeStats, setRouteStats] = useState({
    totalDistance: 0,
    estimatedTime: 0,
    completedCount: 0,
    pendingCount: 0
  });

  useEffect(() => {
    getCurrentLocation();
    fetchTodayPickups();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterStatus, pickups]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setMapCenter([location.lat, location.lng]);
        },
        (error) => {
          console.log('Location permission denied, using default location');
        }
      );
    }
  };

  const fetchTodayPickups = async () => {
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
        
        // Filter today's pickups
        const today = new Date().toDateString();
        const todaysPickups = allPickups.filter(pickup => 
          new Date(pickup.pickupDate).toDateString() === today
        );

        setPickups(todaysPickups);
        setFilteredPickups(todaysPickups);
        calculateRouteStats(todaysPickups);
      }
    } catch (error) {
      console.error('Error fetching pickups:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (filterStatus === 'all') {
      setFilteredPickups(pickups);
    } else {
      const filtered = pickups.filter(p => {
        if (filterStatus === 'pending') {
          return p.status === 'scheduled' || p.status === 'confirmed';
        }
        if (filterStatus === 'in-progress') {
          return p.status === 'in-progress';
        }
        if (filterStatus === 'completed') {
          return p.status === 'completed';
        }
        return true;
      });
      setFilteredPickups(filtered);
    }
  };

  const calculateRouteStats = (pickupList) => {
    const completed = pickupList.filter(p => p.status === 'completed').length;
    const pending = pickupList.filter(p => 
      p.status === 'scheduled' || p.status === 'confirmed' || p.status === 'in-progress'
    ).length;

    // Rough calculation: 5km average per pickup, 20km/h average speed
    const totalDistance = pickupList.length * 5;
    const estimatedTime = Math.ceil((totalDistance / 20) * 60); // in minutes

    setRouteStats({
      totalDistance,
      estimatedTime,
      completedCount: completed,
      pendingCount: pending
    });
  };

  const getMarkerColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in-progress':
        return '#9c27b0';
      case 'confirmed':
        return '#2196f3';
      default:
        return '#ff9800';
    }
  };

  const getMarkerIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '⚡';
      case 'confirmed':
        return '📍';
      default:
        return '📦';
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

  const getTimeSlotDisplay = (slot) => {
    const slots = {
      morning: '6-10 AM',
      afternoon: '10 AM-2 PM',
      evening: '2-6 PM'
    };
    return slots[slot] || slot;
  };

  const openGoogleMaps = (pickup) => {
    const address = encodeURIComponent(pickup.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    window.open(url, '_blank');
  };

  const handleStartPickup = async (pickupId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/pickup/${pickupId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'in-progress' })
      });

      if (response.ok) {
        fetchTodayPickups();
      }
    } catch (error) {
      console.error('Error starting pickup:', error);
    }
  };

  // Generate route line coordinates
  const getRouteCoordinates = () => {
    if (!currentLocation || filteredPickups.length === 0) return [];
    
    const coords = [[currentLocation.lat, currentLocation.lng]];
    
    // Add pickup locations (using address as approximate coordinates for demo)
    filteredPickups.forEach((pickup, index) => {
      // In real app, you'd geocode the address to get coordinates
      // For demo, creating nearby points
      coords.push([
        mapCenter[0] + (Math.random() - 0.5) * 0.05,
        mapCenter[1] + (Math.random() - 0.5) * 0.05
      ]);
    });
    
    return coords;
  };

  if (loading) {
    return (
      <div className="routes-loading">
        <Loader size={48} className="spinner-routes" />
        <p>Loading routes...</p>
      </div>
    );
  }

  return (
    <div className="my-routes-container">
      {/* Header with Stats */}
      <div className="routes-header">
        <div className="routes-stats-row">
          <div className="route-stat-card">
            <div className="route-stat-icon distance">
              <Navigation size={20} />
            </div>
            <div className="route-stat-content">
              <span className="route-stat-value">{routeStats.totalDistance} km</span>
              <span className="route-stat-label">Total Distance</span>
            </div>
          </div>

          <div className="route-stat-card">
            <div className="route-stat-icon time">
              <Clock size={20} />
            </div>
            <div className="route-stat-content">
              <span className="route-stat-value">{routeStats.estimatedTime} min</span>
              <span className="route-stat-label">Est. Time</span>
            </div>
          </div>

          <div className="route-stat-card">
            <div className="route-stat-icon pending">
              <Target size={20} />
            </div>
            <div className="route-stat-content">
              <span className="route-stat-value">{routeStats.pendingCount}</span>
              <span className="route-stat-label">Pending</span>
            </div>
          </div>

          <div className="route-stat-card">
            <div className="route-stat-icon completed">
              <CheckCircle size={20} />
            </div>
            <div className="route-stat-content">
              <span className="route-stat-value">{routeStats.completedCount}</span>
              <span className="route-stat-label">Completed</span>
            </div>
          </div>
        </div>

        {/* View Toggle and Filters */}
        <div className="routes-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${view === 'map' ? 'active' : ''}`}
              onClick={() => setView('map')}
            >
              <Map size={18} />
              Map View
            </button>
            <button 
              className={`toggle-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              <List size={18} />
              List View
            </button>
          </div>

          <div className="filter-dropdown">
            <Filter size={18} />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Pickups</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {filteredPickups.length === 0 ? (
        <div className="routes-empty">
          <div className="empty-icon-routes">🗺️</div>
          <h3>No pickups found</h3>
          <p>Check back later or change your filter</p>
        </div>
      ) : (
        <>
          {view === 'map' ? (
            <div className="map-view-container">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '600px', width: '100%', borderRadius: '16px' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapCenterAdjuster center={mapCenter} zoom={13} />

                {/* Current Location Marker */}
                {currentLocation && (
                  <Marker 
                    position={[currentLocation.lat, currentLocation.lng]}
                    icon={createCustomIcon('#2196f3', '🚛')}
                  >
                    <Popup>
                      <strong>Your Location</strong>
                      <p>Current position</p>
                    </Popup>
                  </Marker>
                )}

                {/* Pickup Markers */}
                {filteredPickups.map((pickup, index) => {
                  // Generate approximate coordinates for demo
                  const lat = mapCenter[0] + (Math.random() - 0.5) * 0.05;
                  const lng = mapCenter[1] + (Math.random() - 0.5) * 0.05;
                  
                  return (
                    <Marker
                      key={pickup._id}
                      position={[lat, lng]}
                      icon={createCustomIcon(
                        getMarkerColor(pickup.status),
                        getMarkerIcon(pickup.status)
                      )}
                      eventHandlers={{
                        click: () => setSelectedPickup(pickup)
                      }}
                    >
                      <Popup>
                        <div className="map-popup">
                          <div className="popup-header">
                            <span className="popup-icon">{getWasteIcon(pickup.wasteType)}</span>
                            <strong>{pickup.wasteType}</strong>
                          </div>
                          <div className="popup-details">
                            <p><Clock size={14} /> {getTimeSlotDisplay(pickup.timeSlot)}</p>
                            <p><MapPin size={14} /> {pickup.address.substring(0, 40)}...</p>
                            <p style={{ color: getStatusColor(pickup.status) }}>
                              Status: {pickup.status}
                            </p>
                          </div>
                          <button 
                            className="popup-navigate-btn"
                            onClick={() => openGoogleMaps(pickup)}
                          >
                            <Navigation size={14} />
                            Navigate
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Route Line */}
                {getRouteCoordinates().length > 0 && (
                  <Polyline
                    positions={getRouteCoordinates()}
                    color="#ff9800"
                    weight={3}
                    opacity={0.7}
                    dashArray="10, 10"
                  />
                )}
              </MapContainer>

              {/* Selected Pickup Card Overlay */}
              {selectedPickup && (
                <div className="selected-pickup-overlay">
                  <div className="selected-pickup-card">
                    <button 
                      className="close-overlay-btn"
                      onClick={() => setSelectedPickup(null)}
                    >
                      ×
                    </button>
                    
                    <div className="selected-pickup-header">
                      <div className="pickup-type-info">
                        <span className="waste-icon-large">{getWasteIcon(selectedPickup.wasteType)}</span>
                        <div>
                          <h4>{selectedPickup.wasteType}</h4>
                          <span 
                            className="status-badge-selected"
                            style={{ 
                              background: `${getStatusColor(selectedPickup.status)}20`,
                              color: getStatusColor(selectedPickup.status)
                            }}
                          >
                            {selectedPickup.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="selected-pickup-details">
                      <div className="detail-row-selected">
                        <Clock size={16} />
                        <span>{getTimeSlotDisplay(selectedPickup.timeSlot)}</span>
                      </div>
                      <div className="detail-row-selected">
                        <MapPin size={16} />
                        <span>{selectedPickup.address}</span>
                      </div>
                      {selectedPickup.estimatedWeight > 0 && (
                        <div className="detail-row-selected">
                          <Package size={16} />
                          <span>~{selectedPickup.estimatedWeight} kg</span>
                        </div>
                      )}
                      {selectedPickup.contactPhone && (
                        <div className="detail-row-selected">
                          <Phone size={16} />
                          <a href={`tel:${selectedPickup.contactPhone}`}>
                            {selectedPickup.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="selected-pickup-actions">
                      <button 
                        className="action-btn-selected navigate"
                        onClick={() => openGoogleMaps(selectedPickup)}
                      >
                        <Navigation size={16} />
                        Navigate
                      </button>
                      {selectedPickup.status !== 'completed' && (
                        <button 
                          className="action-btn-selected start"
                          onClick={() => handleStartPickup(selectedPickup._id)}
                        >
                          <CheckCircle size={16} />
                          Start Pickup
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="list-view-container">
              {filteredPickups.map((pickup, index) => (
                <div key={pickup._id} className="route-pickup-card">
                  <div className="route-card-number">{index + 1}</div>
                  
                  <div className="route-card-content">
                    <div className="route-card-header">
                      <div className="route-pickup-type">
                        <span className="waste-icon-route">{getWasteIcon(pickup.wasteType)}</span>
                        <h4>{pickup.wasteType}</h4>
                      </div>
                      <span 
                        className="route-status-badge"
                        style={{ 
                          background: `${getStatusColor(pickup.status)}20`,
                          color: getStatusColor(pickup.status)
                        }}
                      >
                        {pickup.status}
                      </span>
                    </div>

                    <div className="route-card-details">
                      <div className="detail-item-route">
                        <Clock size={14} />
                        <span>{getTimeSlotDisplay(pickup.timeSlot)}</span>
                      </div>
                      <div className="detail-item-route">
                        <MapPin size={14} />
                        <span>{pickup.address}</span>
                      </div>
                      {pickup.estimatedWeight > 0 && (
                        <div className="detail-item-route">
                          <Package size={14} />
                          <span>~{pickup.estimatedWeight} kg</span>
                        </div>
                      )}
                      {pickup.contactPhone && (
                        <div className="detail-item-route">
                          <Phone size={14} />
                          <a href={`tel:${pickup.contactPhone}`} className="phone-link-route">
                            {pickup.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="route-card-actions">
                      <button 
                        className="route-action-btn navigate"
                        onClick={() => openGoogleMaps(pickup)}
                      >
                        <ExternalLink size={14} />
                        Navigate
                      </button>
                      <button 
                        className="route-action-btn view-map"
                        onClick={() => {
                          setView('map');
                          setSelectedPickup(pickup);
                        }}
                      >
                        <Map size={14} />
                        View on Map
                      </button>
                      {pickup.status !== 'completed' && (
                        <button 
                          className="route-action-btn start"
                          onClick={() => handleStartPickup(pickup._id)}
                        >
                          <CheckCircle size={14} />
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyRoutes;