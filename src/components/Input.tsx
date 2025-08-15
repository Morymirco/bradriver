import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'outlined' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  variant = 'default',
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputContainerStyle = [
    styles.inputContainer,
    styles[variant],
    isFocused && styles.focused,
    error && styles.error,
    containerStyle,
  ];

  const inputStyleCombined = [
    styles.input,
    styles[`${variant}Input`],
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    inputStyle,
  ];

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={inputStyleCombined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.text.tertiary}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.margin.md,
  },
  
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: '#FFFFFF',
    marginBottom: spacing.margin.xs,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.borderRadius.md,
  },
  
  // Variantes
  default: {
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  outlined: {
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  filled: {
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.background.secondary,
  },
  
  // États
  focused: {
    borderColor: colors.primary[500],
  },
  error: {
    borderColor: colors.error[500],
  },
  
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    paddingVertical: spacing.padding.md,
    paddingHorizontal: spacing.padding.md,
    minHeight: 50,
  },
  
  defaultInput: {},
  outlinedInput: {},
  filledInput: {},
  
  inputWithLeftIcon: {
    paddingLeft: spacing.padding.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.padding.sm,
  },
  
  leftIcon: {
    paddingLeft: spacing.padding.md,
  },
  rightIcon: {
    paddingRight: spacing.padding.md,
  },
  
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.margin.xs,
  },
  errorText: {
    color: colors.error[500],
  },
}); 