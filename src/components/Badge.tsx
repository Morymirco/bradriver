import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}) => {
  const badgeStyle = [
    styles.base,
    styles[variant],
    styles[size],
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyleCombined}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: spacing.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variantes
  primary: {
    backgroundColor: colors.primary[100],
  },
  secondary: {
    backgroundColor: colors.secondary[100],
  },
  success: {
    backgroundColor: colors.success[100],
  },
  error: {
    backgroundColor: colors.error[100],
  },
  warning: {
    backgroundColor: colors.warning[100],
  },
  neutral: {
    backgroundColor: colors.neutral[100],
  },
  
  // Tailles
  small: {
    paddingHorizontal: spacing.padding.sm,
    paddingVertical: spacing.padding.xs,
    minHeight: 20,
  },
  medium: {
    paddingHorizontal: spacing.padding.md,
    paddingVertical: spacing.padding.sm,
    minHeight: 24,
  },
  large: {
    paddingHorizontal: spacing.padding.lg,
    paddingVertical: spacing.padding.md,
    minHeight: 28,
  },
  
  // Textes
  text: {
    fontWeight: typography.fontWeight.medium,
  },
  primaryText: {
    color: colors.primary[700],
  },
  secondaryText: {
    color: colors.secondary[700],
  },
  successText: {
    color: colors.success[700],
  },
  errorText: {
    color: colors.error[700],
  },
  warningText: {
    color: colors.warning[700],
  },
  neutralText: {
    color: colors.neutral[700],
  },
  smallText: {
    fontSize: typography.fontSize.xs,
  },
  mediumText: {
    fontSize: typography.fontSize.sm,
  },
  largeText: {
    fontSize: typography.fontSize.md,
  },
}); 