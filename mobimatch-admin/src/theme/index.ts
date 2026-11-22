// MobiMatch Admin Console - Centralized Design Tokens & Theme Control
// All administrative UI colors, typography, weights, spacing, and border radiuses are managed here.
// Changing values here updates the entire admin frontend application consistently.

export const colors = {
  // Brand Identity (MobiMatch Admin Deep Blue)
  primary: '#1E40AF',
  primaryDark: '#1E3A8A',
  primaryLight: '#DBEAFE',
  primaryLighter: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  primaryText: '#1E40AF',

  // Canvas & Surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceElevated: '#FFFFFF',

  // Text Hierarchies
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',
  borderDark: '#CBD5E1',
  borderLight: '#F1F5F9',

  // Status & Feedback: Success
  success: '#16A34A',
  successBg: '#DCFCE7',
  successBorder: '#86EFAC',
  successText: '#15803D',

  // Status & Feedback: Warning
  warning: '#D97706',
  warningBg: '#FEF3C7',
  warningBorder: '#FDE68A',
  warningText: '#B45309',

  // Status & Feedback: Error / Danger
  error: '#DC2626',
  errorBg: '#FEE2E2',
  errorBorder: '#FCA5A5',
  errorText: '#B91C1C',

  // Status & Feedback: Info
  info: '#1E40AF',
  infoBg: '#DBEAFE',
  infoBorder: '#93C5FD',
  infoText: '#1E3A8A',

  // Accent & Monetization
  adBadgeBg: '#F59E0B',
  adBadgeText: '#FFFFFF',
  promoBadgeBg: '#10B981',
  promoBadgeText: '#FFFFFF',
  promoBorder: '#A7F3D0',
  promoBg: '#ECFDF5',
  promoActionBg: '#059669',
};

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
  black: '900' as const,
};

export const fontSizes = {
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 15,
  xxl: 17,
  title: 18,
  h2: 20,
  h1: 24,
  hero: 28,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
};

export const borderRadius = {
  xs: 3,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  xxl: 14,
  round: 9999,
};

export const typography = {
  h1: { fontSize: fontSizes.h1, fontWeight: fontWeights.bold, color: colors.textPrimary },
  h2: { fontSize: fontSizes.h2, fontWeight: fontWeights.bold, color: colors.textPrimary },
  h3: { fontSize: fontSizes.xxl, fontWeight: fontWeights.semiBold, color: colors.textPrimary },
  h4: { fontSize: fontSizes.xl, fontWeight: fontWeights.semiBold, color: colors.textPrimary },
  body: { fontSize: fontSizes.xl, fontWeight: fontWeights.regular, color: colors.textPrimary },
  bodyMedium: { fontSize: fontSizes.lg, fontWeight: fontWeights.medium, color: colors.textPrimary },
  bodySecondary: { fontSize: fontSizes.lg, fontWeight: fontWeights.regular, color: colors.textSecondary },
  caption: { fontSize: fontSizes.base, fontWeight: fontWeights.regular, color: colors.textMuted },
  captionBold: { fontSize: fontSizes.base, fontWeight: fontWeights.bold, color: colors.textMuted },
  label: { fontSize: fontSizes.base, fontWeight: fontWeights.semiBold, color: colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  button: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold, color: colors.textInverse },
  badge: { fontSize: fontSizes.sm, fontWeight: fontWeights.bold },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};
