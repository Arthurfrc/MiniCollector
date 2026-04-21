// src/constants/theme.ts

export const Colors = {
    primary: '#E63946',
    primaryDark: '#C1121F',
    background: '#0D0D0D',    // Fundo escuro
    surface: '#1A1A1A',       // Cards
    surfaceLight: '#2A2A2A',  // Inputs
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#606060',
    border: '#333333',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',

    condition: {
        mint: '#4CAF50',
        excellent: '#8BC34A',
        good: '#FF9800',
        fair: '#FF5722',
        poor: '#9E9E9E',
    },
} as const;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
} as const;

export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
} as const;

export const Radius = {
    sm: 6,
    md: 10,
    lg: 16,
    full: 999,
} as const;