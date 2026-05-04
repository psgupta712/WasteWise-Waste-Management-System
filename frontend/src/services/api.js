import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* ===========================
   AUTHENTICATION APIs
=========================== */
export const authAPI = {
  register: async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  login: async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore server errors
    }
  },

  getProfile: async () => {
    try {
      const res = await api.get('/auth/profile');
      return res; // return full axios response
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  }
};

/* ===========================
   WASTE MANAGEMENT APIs
=========================== */
export const wasteAPI = {
  classify: async (data) => {
    try {
      const res = await api.post('/waste/classify', data);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Classification failed' };
    }
  },

  getHistory: async (page = 1, limit = 10) => {
    try {
      const res = await api.get(`/waste/history?page=${page}&limit=${limit}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch history' };
    }
  },

  getStats: async () => {
    try {
      const res = await api.get('/waste/stats');
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch statistics' };
    }
  },

  search: async (query) => {
    try {
      const res = await api.get(`/waste/search?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Search failed' };
    }
  },

  delete: async (id) => {
    try {
      const res = await api.delete(`/waste/${id}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete record' };
    }
  }
};

/* ===========================
   PICKUP MANAGEMENT APIs
=========================== */
export const pickupAPI = {
  schedule: async (data) => {
    try {
      const res = await api.post('/pickup/schedule', data);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to schedule pickup' };
    }
  },

  getMyPickups: async (status = '', page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.append('status', status);
      const res = await api.get(`/pickup/my-pickups?${params}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pickups' };
    }
  },

  getById: async (id) => {
    try {
      const res = await api.get(`/pickup/${id}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pickup details' };
    }
  },

  cancel: async (id) => {
    try {
      const res = await api.put(`/pickup/${id}/cancel`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel pickup' };
    }
  },

  complete: async (id, data) => {
    try {
      const res = await api.put(`/pickup/${id}/complete`, data);
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete pickup' };
    }
  },

  getStats: async () => {
    try {
      const res = await api.get('/pickup/stats');
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pickup statistics' };
    }
  }
};

export default api;