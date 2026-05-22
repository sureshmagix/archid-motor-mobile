export const LIGHT_COLORS = {
  primary: '#0f172a',      // Deep slate-900
  primaryDark: '#020617',  // Deep slate-955
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

export const DARK_COLORS = {
  primary: '#1e293b',      // Slate-800
  primaryDark: '#0f172a',  // Slate-900
  accent: '#818cf8',       // Indigo-400
  accentLight: '#1e1b4b',  // Indigo-950
  success: '#34d399',      // Emerald-400
  successLight: '#022c22', // Emerald-950
  danger: '#f87171',       // Red-400
  dangerLight: '#450a0a',  // Red-950
  warning: '#fbbf24',      // Amber-400
  warningLight: '#451a03', // Amber-950
  off: '#64748b',          // Slate-500
  offLight: '#1e293b',     // Slate-800
  page: '#0f172a',         // Slate-900
  card: '#1e293b',         // Slate-800
  text: '#f8fafc',         // Slate-50
  muted: '#94a3b8',        // Slate-400
  border: '#334155',       // Slate-700
  borderLight: '#1e293b',  // Slate-800
  shadow: '#000000',       // Black for dark shadows
};

// Fallback export to maintain backward compatibility
export const COLORS = LIGHT_COLORS;

export const statusColor = (status, colors) => {
  const themeColors = colors || COLORS;
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ON' || normalized === 'RUNNING' || normalized === 'ACTIVE') {
    return themeColors.success;
  }
  if (normalized === 'FAULT' || normalized === 'ERROR' || normalized === 'TRIP') {
    return themeColors.danger;
  }
  if (normalized === 'OFF' || normalized === 'STOPPED') {
    return themeColors.off;
  }
  if (normalized === 'PENDING') {
    return themeColors.accent;
  }
  return themeColors.off;
};
