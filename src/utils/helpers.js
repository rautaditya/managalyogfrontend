// Format Indian currency
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount || 0);

// Format date to readable
export const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(
        new Date(date)
      )
    : '—';

// Format date for input[type=date]
export const toInputDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

// Download blob as file
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Get error message from axios error
export const getError = (err) =>
  err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || err?.message || 'Something went wrong';

// Status badge CSS class — maps to index.css badge classes
export const statusColor = (status) => {
  const map = {
    'Tax Invoice':      'badge-paid',
    'Proforma Invoice': 'badge-unpaid',
    paid:               'badge-paid',
    unpaid:             'badge-unpaid',
    overdue:            'badge-overdue',
    cancelled:          'badge-cancelled',
    active:             'badge-active',
    inactive:           'badge-inactive',
    draft:              'badge-draft',
    sent:               'badge-sent',
    converted:          'badge-converted',
  };
  return map[status] || 'badge-draft';
};

// MySQL returns snake_case; these helpers safely read either format
export const field = (obj, snake, camel) =>
  obj?.[snake] != null ? obj[snake] : obj?.[camel];
