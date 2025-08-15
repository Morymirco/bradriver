import { colors } from './colors';

export const typography = {
  // Tailles de police
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
  },
  
  // Poids de police
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Styles de texte prédéfinis
  textStyles: {
    // Titres
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      color: colors.text.primary,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      color: colors.text.primary,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      color: colors.text.primary,
    },
    h4: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 24,
      color: colors.text.primary,
    },
    
    // Corps de texte
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: colors.text.primary,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      color: colors.text.secondary,
    },
    
    // Boutons
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
      color: colors.text.inverse,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
      color: colors.text.inverse,
    },
    
    // Captions
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      color: colors.text.tertiary,
    },
    
    // Labels
    label: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      color: colors.text.primary,
    },
  },
}; 