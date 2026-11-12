export const colors = {
  primary: '#0284C7', // User Teal/Sky Blue
  primaryDark: '#0369A1',
  primaryLight: '#E0F2FE',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 17, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  bodySecondary: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
  button: { fontSize: 15, fontWeight: '600' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
