export const COLORS = {
  primary: '#0f172a',      // Deep slate-900
  primaryDark: '#020617',  // Deep slate-950
  accent: '#6366f1',       // Indigo-500
  accentLight: '#eef2ff',  // Indigo-50
  success: '#10b981',      // Emerald-500
  successLight: '#ecfdf5', // Emerald-50
  danger: '#ef4444',       // Red-500
  dangerLight: '#fef2f2',  // Red-50
  warning: '#f59e0b',      // Amber-500
  warningLight: '#fffbeb', // Amber-50
  off: '#64748b',          // Slate-500
  offLight: '#f1f5f9',     // Slate-100
  page: '#f8fafc',         // Slate-50
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',       // Slate-200
  borderLight: '#f1f5f9',  // Slate-100
  shadow: '#0f172a',
};

export const statusColor = status => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ON' || normalized === 'RUNNING' || normalized === 'ACTIVE') {
    return COLORS.success;
  }
  if (normalized === 'FAULT' || normalized === 'ERROR' || normalized === 'TRIP') {
    return COLORS.danger;
  }
  if (normalized === 'OFF' || normalized === 'STOPPED') {
    return COLORS.off;
  }
  if (normalized === 'PENDING') {
    return COLORS.accent;
  }
  return COLORS.off;
};

