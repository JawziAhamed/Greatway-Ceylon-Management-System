import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
let apiBaseUrl = '/api';

if (rawApiUrl) {
  apiBaseUrl = rawApiUrl.endsWith('/api')
    ? rawApiUrl
    : `${rawApiUrl.replace(/\/+$/, '')}/api`;
}

export const getBackendOrigin = () => {
  if (rawApiUrl) {
    return rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  return '';
};

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const origin = getBackendOrigin();
  return origin ? `${origin}${url.startsWith('/') ? '' : '/'}${url}` : url;
};

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const userJson = localStorage.getItem('gw_user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (err) {
        console.error('Error reading auth token:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear user and redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('gw_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
