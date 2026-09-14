// Shared styles for admin tables — matches the main app palette.
export const colors = {
  main: '#5ec8e0',
  mainLight: '#e1f6fb',
  dark: '#2a2b3d',
  darkMedium: '#34354a',
  darkLight: '#40425a',
  light: '#f0f0f5',
  gray: '#7a7c90',
  lightGray: '#a8aabc',
  bg: '#1e1f2b',
  success: '#4ade80',
  error: '#ff5c3a',
};

export const card = {
  background: colors.darkMedium,
  borderRadius: '14px',
  border: `1px solid ${colors.darkLight}`,
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  overflow: 'hidden',
};

export const pageHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  marginBottom: '24px',
};

export const pageHeaderTop = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
  flexShrink: 0,
};

export const title = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#fff',
  margin: 0,
  letterSpacing: '-0.01em',
};

export const searchInput = {
  background: colors.dark,
  border: `1px solid ${colors.darkLight}`,
  borderRadius: '9px',
  padding: '10px 14px',
  color: colors.light,
  fontSize: '14px',
  outline: 'none',
  minWidth: '180px',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

export const selectInput = {
  ...searchInput,
  minWidth: '140px',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237a7c90' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
};

export const filterBar = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  alignItems: 'center',
  marginLeft: 'auto',
};

export const table = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
};

export const th = {
  textAlign: 'left',
  padding: '13px 16px',
  color: colors.lightGray,
  fontWeight: '600',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderBottom: `1px solid ${colors.dark}`,
  whiteSpace: 'nowrap',
  background: 'rgba(0,0,0,0.15)',
};

export const td = {
  padding: '13px 16px',
  borderBottom: `1px solid ${colors.dark}`,
  color: colors.light,
  verticalAlign: 'middle',
};

export const btn = (variant = 'default') => {
  const base = {
    fontSize: '13px',
    padding: '7px 14px',
    borderRadius: '7px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 150ms ease, opacity 150ms ease',
  };

  const variants = {
    default: { background: colors.dark, color: colors.lightGray },
    primary: { background: colors.main, color: colors.dark },
    danger: { background: colors.error, color: '#fff' },
    success: { background: colors.success, color: colors.dark },
  };

  return { ...base, ...(variants[variant] || variants.default) };
};

export const badge = (variant = 'default') => {
  const base = {
    display: 'inline-block',
    padding: '4px 11px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  };

  const variants = {
    default: { background: colors.dark, color: colors.lightGray },
    superuser: { background: colors.main, color: colors.dark },
    staff: { background: colors.success, color: colors.dark },
    inactive: { background: colors.error, color: '#fff' },
  };

  return { ...base, ...(variants[variant] || variants.default) };
};

export const emptyState = {
  padding: '48px 16px',
  textAlign: 'center',
  color: colors.gray,
  fontSize: '14px',
};

export const errorBox = {
  background: 'rgba(255, 92, 58, 0.12)',
  border: `1px solid ${colors.error}`,
  color: colors.error,
  borderRadius: '9px',
  padding: '12px 16px',
  fontSize: '14px',
  marginBottom: '16px',
};

export const pagination = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '12px',
  marginTop: '20px',
  color: colors.lightGray,
  fontSize: '14px',
};

export const tableWrap = {
  overflowX: 'auto',
  width: '100%',
};
