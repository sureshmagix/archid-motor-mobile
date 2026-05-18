export const COLORS = {
  primary: '#2c3e50',
  primaryDark: '#1c2431',
  accent: '#3498db',
  success: '#27ae60',
  danger: '#c0392b',
  warning: '#f39c12',
  off: '#95a5a6',
  page: '#f4f7f6',
  card: '#ffffff',
  text: '#2c3e50',
  muted: '#7f8c8d',
  border: '#e6eaee',
  shadow: '#000000',
};

export const statusColor = status => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ON' || normalized === 'RUNNING' || normalized === 'ACTIVE') {
    return COLORS.success;
  }
  if (normalized === 'FAULT' || normalized === 'ERROR' || normalized === 'TRIP') {
    return COLORS.warning;
  }
  if (normalized === 'OFF' || normalized === 'STOPPED') {
    return COLORS.off;
  }
  if (normalized === 'PENDING') {
    return COLORS.accent;
  }
  return COLORS.off;
};
