import React from 'react';
import { Pressable, PressableProps, Text, StyleSheet } from 'react-native';
import { useTheme } from '../_context/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props extends PressableProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
}

export default function AppButton({ children, variant = 'primary', style, disabled, ...rest }: Props) {
  const { colors, sizing, fonts, shadows, compact } = useTheme();
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.card : 'transparent';
  const contentColor = variant === 'primary' || variant === 'danger' || variant === 'success' ? '#fff' : colors.text;
  const variantBackground = variant === 'danger' ? colors.danger : variant === 'success' ? colors.success : backgroundColor;

  const minDim = Math.round(Math.max(36, sizing.gutter * 3));
  const baseStyle = [
    styles.button,
    { borderRadius: Math.max(6, Math.round(sizing.radius)), paddingVertical: Math.round(sizing.gutter * 0.55), paddingHorizontal: Math.round(sizing.gutter * 1.0), minHeight: minDim, minWidth: Math.round(Math.max(44, minDim)) },
    variant === 'secondary' && [styles.secondary, { borderColor: colors.muted }],
    variant === 'ghost' && { backgroundColor: 'transparent' },
    style,
    (variant === 'primary' || variant === 'danger' || variant === 'success') ? (shadows.medium as any) : (variant === 'secondary' ? (shadows.small as any) : undefined),
  ];
  // Ensure shadows are more subtle for small buttons on phones

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      android_ripple={{ color: '#0000001a' }}
      style={({ pressed }) => [
        ...baseStyle,
        { backgroundColor: pressed ? (variantBackground + 'cc') : variantBackground, opacity: disabled ? 0.6 : 1, transform: pressed ? [{ scale: 0.985 }] : [{ scale: 1 }] },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled ?? undefined }}
    >
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={[styles.text, { color: contentColor, fontSize: fonts.sm }]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}


const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
  secondary: { borderWidth: 1, borderColor: '#e6e6e6' },
  iosShadow: {},
  androidShadow: {},
});
