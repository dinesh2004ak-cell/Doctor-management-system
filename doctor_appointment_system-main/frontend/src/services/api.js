import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => {
    const isFormData = data instanceof FormData;
    return api.post('/auth/register', data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
  },
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  uploadAvatar: (formData) => api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Users API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAppointments: (params) => api.get('/users/appointments', { params }),
  getUpcomingAppointments: () => api.get('/users/appointments/upcoming'),
  getPrescriptions: (params) => api.get('/users/prescriptions', { params }),
  getPrescription: (id) => api.get(`/users/prescriptions/${id}`),
  getNotifications: (params) => api.get('/users/notifications', { params }),
  markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/users/notifications/read-all'),
  getDashboard: () => api.get('/users/dashboard')
};

// Doctors API
export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  register: (data) => api.post('/doctors/register', data),
  updateProfile: (data) => api.put('/doctors/profile', data),
  getMyProfile: () => api.get('/doctors/profile/my'),
  setAvailability: (data) => api.put('/doctors/availability', data),
  addAvailabilityException: (data) => api.post('/doctors/availability/exception', data),
  getAppointments: (params) => api.get('/doctors/appointments/list', { params }),
  getTodayAppointments: () => api.get('/doctors/appointments/today'),
  getPrescriptions: (params) => api.get('/doctors/prescriptions/list', { params }),
  getDashboard: () => api.get('/doctors/dashboard/stats'),
  uploadCertificate: (formData) => api.post('/doctors/upload/certificate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadCertificates: (formData) => api.post('/doctors/upload/certificates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadAvatar: (formData) => api.post('/doctors/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Appointments API
export const appointmentAPI = {
  book: (data) => api.post('/appointments', data),
  getAvailableSlots: (doctorId, date) => api.get(`/appointments/slots/${doctorId}`, { params: { date } }),
  getById: (id) => api.get(`/appointments/${id}`),
  confirm: (id) => api.put(`/appointments/${id}/confirm`),
  cancel: (id, reason) => api.put(`/appointments/${id}/cancel`, { reason }),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  complete: (id, notes) => api.put(`/appointments/${id}/complete`, { notes }),
  markNoShow: (id) => api.put(`/appointments/${id}/no-show`),
  rate: (id, rating) => api.put(`/appointments/${id}/rate`, { rating })
};

// Prescriptions API
export const prescriptionAPI = {
  create: (data) => api.post('/prescriptions', data),
  getById: (id) => api.get(`/prescriptions/${id}`),
  getByAppointment: (appointmentId) => api.get(`/prescriptions/appointment/${appointmentId}`),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
  addAttachment: (id, formData) => api.post(`/prescriptions/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDoctors: (params) => api.get('/admin/doctors', { params }),
  getDoctor: (id) => api.get(`/admin/doctors/${id}`),
  approveDoctor: (id) => api.put(`/admin/doctors/${id}/approve`),
  rejectDoctor: (id, reason) => api.put(`/admin/doctors/${id}/reject`, { reason }),
  toggleDoctorActive: (id) => api.put(`/admin/doctors/${id}/toggle-active`),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  toggleUserActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  getAppointments: (params) => api.get('/admin/appointments', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getRevenue: (period) => api.get('/admin/revenue', { params: { period } }),
  uploadLogo: (formData) => api.post('/admin/upload/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Notifications API
// export const notificationAPI = {
//   getAll: (params) => api.get('/notifications', { params }),
//   getUnreadCount: () => api.get('/notifications/unread-count'),
//   markAsRead: (id) => api.put(`/notifications/${id}/read`),
//   markAllAsRead: () => api.put('/notifications/read-all'),
//   delete: (id) => api.delete(`/notifications/${id}`),
//   deleteAllRead: () => api.delete('/notifications')
// };

export const notificationAPI = {
  getNotifications: () => api.get("/notifications"),

  getUnreadCount: () => api.get("/notifications/unread-count"),

  markAllAsRead: () => api.put("/notifications/read-all"),
};

export default api;
