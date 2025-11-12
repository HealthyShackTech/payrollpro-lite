// Axios configuration with automatic token injection
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and HTML responses
api.interceptors.response.use(
  (response) => {
    // Check if response is HTML instead of JSON
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('Server returned HTML instead of JSON. Response:', response.data?.substring(0, 200));
      return Promise.reject({
        message: 'Server returned HTML instead of JSON',
        response: {
          ...response,
          data: { error: 'Invalid response format from server' }
        }
      });
    }
    return response;
  },
  (error) => {
    // Handle JSON parsing errors
    if (error.message && error.message.includes('JSON')) {
      console.error('JSON parsing error. This usually means the server returned HTML instead of JSON.');
      return Promise.reject({
        ...error,
        message: 'Server returned invalid data format. Please check if the server is running correctly.',
        isHtmlResponse: true
      });
    }
    
    // If token is invalid or expired, clear auth and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

