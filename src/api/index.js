import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const sitesAPI = {
  getAll: (params) => api.get('/sites', { params }),
  getById: (id) => api.get(`/sites/${id}`),
  getDashboard: (id) => api.get(`/sites/${id}/dashboard`),
  create: (data) => api.post('/sites', normalizeSite(data)),
  update: (id, data) => api.put(`/sites/${id}`, normalizeSite(data)),
  delete: (id) => api.delete(`/sites/${id}`),
};

export const transactionsAPI = {
  getAll: (params) => {
    const p = {};
    if (params?.site_id || params?.siteId) p.site_id = params.site_id || params.siteId;
    if (params?.type) p.type = params.type;
    if (params?.payment_mode || params?.paymentMode) p.payment_mode = params.payment_mode || params.paymentMode;
    if (params?.start_date) p.start_date = params.start_date;
    if (params?.end_date) p.end_date = params.end_date;
    return api.get('/transactions', { params: p });
  },
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', normalizeTransaction(data)),
  update: (id, data) => api.put(`/transactions/${id}`, normalizeTransaction(data)),
  delete: (id) => api.delete(`/transactions/${id}`),
  summary: () => api.get('/transactions/summary'),
  exportExcel: (params) => {
    const p = {};
    if (params?.site_id || params?.siteId) p.site_id = params.site_id || params.siteId;
    return api.get('/transactions/export', { params: p, responseType: 'blob' });
  },
};

export const invoicesAPI = {
  getAll: (params) => {
    const p = {};
    if (params?.site_id || params?.siteId) p.site_id = params.site_id || params.siteId;
    if (params?.status) p.status = params.status;
    return api.get('/invoices', { params: p });
  },
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', normalizeInvoice(data)),
  update: (id, data) => api.put(`/invoices/${id}`, normalizeInvoice(data)),
  delete: (id) => api.delete(`/invoices/${id}`),
  downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

export const quotationsAPI = {
  getAll: (params) => {
    const p = {};
    if (params?.site_id || params?.siteId) p.site_id = params.site_id || params.siteId;
    if (params?.status) p.status = params.status;
    return api.get('/quotations', { params: p });
  },
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', normalizeQuotation(data)),
  update: (id, data) => api.put(`/quotations/${id}`, normalizeQuotation(data)),
  delete: (id) => api.delete(`/quotations/${id}`),
  convert: (id) => api.post(`/quotations/${id}/convert`),
  downloadPDF: (id) => api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
};

function normalizeSite(data) {
  return {
    name: data.name,
    address: data.address,
    owner_name: data.owner_name || data.ownerName || null,
    phone: data.phone || null,
    gst_number: data.gst_number || data.gstNumber || null,
    project_name: data.project_name || data.projectName || null,
    status: data.status || 'active',
    notes: data.notes || null,
  };
}

function normalizeTransaction(data) {
  return {
    type: data.type,
    amount: data.amount,
    site_id: data.site_id || data.siteId,
    name: data.name,
    description: data.description || null,
    note: data.note || null,
    payment_mode: data.payment_mode || data.paymentMode || 'Cash',
    date: data.date,
  };
}

function normalizeInvoice(data) {
  return {
    site_id: data.site_id || null,
    client_name: data.client_name || null,
    items: data.items,
    tax_rate: data.tax_rate != null ? data.tax_rate : (data.taxRate != null ? data.taxRate : 0),
    status: data.status,
    due_date: data.due_date || data.dueDate || null,
    notes: data.notes || null,
    date: data.date || null,
    advance_amount: data.advance_amount ? parseFloat(data.advance_amount) : 0,
  };
}

function normalizeQuotation(data) {
  return {
    site_id: data.site_id || null,
    client_name: data.client_name || null,
    items: data.items,
    tax_rate: data.tax_rate != null ? data.tax_rate : (data.taxRate != null ? data.taxRate : 0),
    status: data.status,
    valid_until: data.valid_until || data.validUntil || null,
    notes: data.notes || null,
    date: data.date || null,
    advance_amount: data.advance_amount ? parseFloat(data.advance_amount) : 0,
  };
}

export default api;