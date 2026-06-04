const BASE_URL = 'http://localhost:5000/api';

const fetchClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {};
  
  // Only set application/json if it's not a FormData request
  if (!options.isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Remove isFormData from config as fetch doesn't recognize it
  delete config.isFormData;

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if ((response.status === 401 || response.status === 403) && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Có lỗi xảy ra');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const api = {
  get: (endpoint, params) => {
    let url = endpoint;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${endpoint}?${queryString}`;
    }
    return fetchClient(url, { method: 'GET' });
  },

  post: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return fetchClient(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
      isFormData,
    });
  },

  put: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return fetchClient(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
      isFormData,
    });
  },

  delete: (endpoint) => {
    return fetchClient(endpoint, { method: 'DELETE' });
  },
};
