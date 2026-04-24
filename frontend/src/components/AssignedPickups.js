import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  Calendar,
  MapPin,
  Phone,
  Navigation,
  CheckCircle,
  Clock,
  User,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
  Loader,
  ExternalLink,
  Play,
  RefreshCw,
  ArrowUpDown,
  Grid,
  List as ListIcon,
  Check,
} from "lucide-react";
import "./AssignedPickups.css";

const AssignedPickups = () => {
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState([]);
  const [filteredPickups, setFilteredPickups] = useState([]);
  const [view, setView] = useState("grid"); // 'grid' or 'list'

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wasteTypeFilter, setWasteTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all"); // 'all', 'today', 'week', 'month'
  const [sortBy, setSortBy] = useState("date"); // 'date', 'status', 'wastetype'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Bulk selection
  const [selectedPickups, setSelectedPickups] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    fetchPickups();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [pickups, searchQuery, statusFilter, wasteTypeFilter, dateRange, sortBy]);

  const fetchPickups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const [assignedRes, availableRes] = await Promise.all([
        fetch("http://localhost:5000/api/pickup/my-pickups", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/pickup/available", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const assignedData = await assignedRes.json();
      const availableData = await availableRes.json();

      const allPickups = [
        ...(assignedData.data || []),
        ...(availableData.data || []),
      ];

      // ✅ Now use allPickups directly
      setPickups(allPickups);
      calculateStats(allPickups);
    } catch (error) {
      console.error("Error fetching pickups:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (pickupList) => {
    setStats({
      total: pickupList.length,
      scheduled: pickupList.filter((p) => p.status === "scheduled").length,
      confirmed: pickupList.filter((p) => p.status === "confirmed").length,
      inProgress: pickupList.filter((p) => p.status === "in-progress").length,
      completed: pickupList.filter((p) => p.status === "completed").length,
      cancelled: pickupList.filter((p) => p.status === "cancelled").length,
    });
  };

  const applyFiltersAndSort = () => {
    let filtered = [...pickups];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.wasteType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.user?.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Waste type filter
    if (wasteTypeFilter !== "all") {
      filtered = filtered.filter((p) => p.wasteType === wasteTypeFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((p) => {
        const pickupDate = new Date(p.pickupDate);

        if (dateRange === "today") {
          return pickupDate.toDateString() === today.toDateString();
        } else if (dateRange === "week") {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return pickupDate >= weekAgo;
        } else if (dateRange === "month") {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return pickupDate >= monthAgo;
        }
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.pickupDate) - new Date(a.pickupDate);
      } else if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      } else if (sortBy === "wastetype") {
        return a.wasteType.localeCompare(b.wasteType);
      }
      return 0;
    });

    setFilteredPickups(filtered);
    setCurrentPage(1);
  };

  const handleSelectPickup = (pickupId) => {
    setSelectedPickups((prev) =>
      prev.includes(pickupId)
        ? prev.filter((id) => id !== pickupId)
        : [...prev, pickupId],
    );
  };

  const handleSelectAll = () => {
    if (selectedPickups.length === currentPickups.length) {
      setSelectedPickups([]);
    } else {
      setSelectedPickups(currentPickups.map((p) => p._id));
    }
  };

  const handleBulkStart = async () => {
    if (selectedPickups.length === 0) return;

    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedPickups.map((id) =>
          fetch(`http://localhost:5000/api/pickup/${id}/start`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "in-progress" }),
          }),
        ),
      );

      setSelectedPickups([]);
      fetchPickups();
      alert(`Started ${selectedPickups.length} pickups!`);
    } catch (error) {
      console.error("Bulk start error:", error);
      alert("Error starting pickups");
    }
  };

  const handleStartPickup = async (pickupId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/pickup/${pickupId}/start`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        fetchPickups();
        alert(
          'Pickup started! Go to "Complete Pickup" tab to enter the verification code and finish the pickup.',
        ); // ✅ Guide the agent
      } else {
        const data = await response.json();
        alert(data.message || "Failed to start pickup");
      }
    } catch (error) {
      console.error("Error starting pickup:", error);
    }
  };

  const openGoogleMaps = (address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, "_blank");
  };

  const getWasteIcon = (type) => {
    const icons = {
      biodegradable: "🍃",
      recyclable: "♻️",
      "e-waste": "📱",
      hazardous: "⚠️",
    };
    return icons[type] || "📦";
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "#ff9800",
      confirmed: "#2196f3",
      "in-progress": "#9c27b0",
      completed: "#4caf50",
      cancelled: "#f44336",
    };
    return colors[status] || "#999";
  };

  const getTimeSlotDisplay = (slot) => {
    const slots = {
      morning: "6-10 AM",
      afternoon: "10 AM-2 PM",
      evening: "2-6 PM",
    };
    return slots[slot] || slot;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPickups = filteredPickups.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredPickups.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="assigned-pickups-loading">
        <Loader size={48} className="spinner-assigned" />
        <p>Loading assigned pickups...</p>
      </div>
    );
  }

  return (
    <div className="assigned-pickups-container">
      {/* Header with Stats */}
      <div className="assigned-header">
        <div className="header-title-section">
          {/* <h2>Assigned Pickups</h2> */}
          {/* <h2>Manage all your assigned waste collection task</h2> */}
        </div>
        <button className="refresh-btn" onClick={fetchPickups}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card total">
          <div className="stat-icon-wrapper">
            <Package size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        <div className="quick-stat-card scheduled">
          <div className="stat-icon-wrapper">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-number">
              {stats.scheduled + stats.confirmed}
            </span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <div className="quick-stat-card in-progress">
          <div className="stat-icon-wrapper">
            <Play size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>

        <div className="quick-stat-card completed">
          <div className="stat-icon-wrapper">
            <CheckCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="filters-bar">
        <div className="search-box-assigned">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by address, customer, or waste type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filters-actions">
          <button
            className={`filter-toggle-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <div className="view-switcher">
            <button
              className={`view-btn ${view === "grid" ? "active" : ""}`}
              onClick={() => setView("grid")}
            >
              <Grid size={18} />
            </button>
            <button
              className={`view-btn ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Waste Type</label>
            <select
              value={wasteTypeFilter}
              onChange={(e) => setWasteTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="biodegradable">Biodegradable</option>
              <option value="recyclable">Recyclable</option>
              <option value="e-waste">E-Waste</option>
              <option value="hazardous">Hazardous</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Date</option>
              <option value="status">Status</option>
              <option value="wastetype">Waste Type</option>
            </select>
          </div>

          <button
            className="clear-filters-btn"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setWasteTypeFilter("all");
              setDateRange("all");
              setSortBy("date");
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedPickups.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <Check size={18} />
            <span>{selectedPickups.length} selected</span>
          </div>
          <div className="bulk-buttons">
            <button className="bulk-btn start" onClick={handleBulkStart}>
              <Play size={16} />
              Start Selected
            </button>
            <button
              className="bulk-btn cancel"
              onClick={() => setSelectedPickups([])}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="results-info">
        <p>
          Showing {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredPickups.length)} of{" "}
          {filteredPickups.length} pickups
        </p>
        {selectedPickups.length === 0 && currentPickups.length > 0 && (
          <button className="select-all-btn" onClick={handleSelectAll}>
            Select All on Page
          </button>
        )}
      </div>

      {/* Pickups Display */}
      {filteredPickups.length === 0 ? (
        <div className="no-pickups-found">
          <div className="empty-icon-assigned">📦</div>
          <h3>No pickups found</h3>
          <p>Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <>
          <div className={`pickups-${view}-view`}>
            {currentPickups.map((pickup) => (
              <div
                key={pickup._id}
                className={`pickup-card-assigned ${selectedPickups.includes(pickup._id) ? "selected" : ""}`}
              >
                {/* Selection Checkbox */}
                <div className="pickup-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedPickups.includes(pickup._id)}
                    onChange={() => handleSelectPickup(pickup._id)}
                  />
                </div>

                {/* Pickup Header */}
                <div className="pickup-card-header-assigned">
                  <div className="pickup-type-assigned">
                    <span className="waste-icon-assigned">
                      {getWasteIcon(pickup.wasteType)}
                    </span>
                    <div>
                      <h4>{pickup.wasteType}</h4>
                      <span className="pickup-id">#{pickup._id.slice(-6)}</span>
                    </div>
                  </div>
                  <span
                    className="status-badge-assigned"
                    style={{
                      background: `${getStatusColor(pickup.status)}20`,
                      color: getStatusColor(pickup.status),
                    }}
                  >
                    {pickup.status}
                  </span>
                </div>

                {/* Pickup Details */}
                <div className="pickup-details-assigned">
                  <div className="detail-row-assigned">
                    <Calendar size={14} />
                    <span>{formatDate(pickup.pickupDate)}</span>
                  </div>
                  <div className="detail-row-assigned">
                    <Clock size={14} />
                    <span>{getTimeSlotDisplay(pickup.timeSlot)}</span>
                  </div>
                  <div className="detail-row-assigned">
                    <MapPin size={14} />
                    <span>{pickup.address}</span>
                  </div>
                  {pickup.user && (
                    <div className="detail-row-assigned">
                      <User size={14} />
                      <span>{pickup.user.name}</span>
                    </div>
                  )}
                  {pickup.contactPhone && (
                    <div className="detail-row-assigned">
                      <Phone size={14} />
                      <a
                        href={`tel:${pickup.contactPhone}`}
                        className="phone-link-assigned"
                      >
                        {pickup.contactPhone}
                      </a>
                    </div>
                  )}
                  {pickup.estimatedWeight > 0 && (
                    <div className="detail-row-assigned">
                      <TrendingUp size={14} />
                      <span>~{pickup.estimatedWeight} kg</span>
                    </div>
                  )}
                </div>

                {/* Special Instructions */}
                {pickup.specialInstructions && (
                  <div className="special-instructions">
                    <AlertCircle size={14} />
                    <span>{pickup.specialInstructions}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pickup-actions-assigned">
                  <button
                    className="action-btn-assigned navigate"
                    onClick={() => openGoogleMaps(pickup.address)}
                  >
                    <Navigation size={14} />
                    Navigate
                  </button>
                  {pickup.contactPhone && (
                    <button
                      className="action-btn-assigned call"
                      onClick={() => window.open(`tel:${pickup.contactPhone}`)}
                    >
                      <Phone size={14} />
                      Call
                    </button>
                  )}
                  {(pickup.status === "scheduled" ||
                    pickup.status === "confirmed") && (
                    <button
                      className="action-btn-assigned start"
                      onClick={() => handleStartPickup(pickup._id)}
                    >
                      <Play size={14} />
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-assigned">
              <button
                className="page-btn"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <div className="page-numbers">
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
                        className={`page-number ${currentPage === pageNum ? "active" : ""}`}
                        onClick={() => paginate(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="page-ellipsis">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                className="page-btn"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AssignedPickups;
