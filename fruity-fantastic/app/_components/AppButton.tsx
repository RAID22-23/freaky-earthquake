import React from 'react';
import { Pressable, PressableProps, Text, StyleSheet } from 'react-native';
import { Shadow } from '../_utils/styles';
import { useTheme } from '../_context/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props extends PressableProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
}

export default function AppButton({ children, variant = 'primary', style, disabled, ...rest }: Props) {
  const { colors, sizing, fonts } = useTheme();
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.card : 'transparent';
  const contentColor = variant === 'primary' || variant === 'danger' || variant === 'success' ? '#fff' : colors.text;
  const variantBackground = variant === 'danger' ? colors.danger : variant === 'success' ? colors.success : backgroundColor;

  const baseStyle = [
    styles.button,
    { borderRadius: sizing.radius, paddingVertical: Math.round(sizing.gutter * 0.6), paddingHorizontal: Math.round(sizing.gutter * 1.2) },
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && { backgroundColor: 'transparent' },
    style,
    (Shadow.small as any),
  ];

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      android_ripple={{ color: '#0000001a' }}
      style={({ pressed }) => [
        ...baseStyle,
        { backgroundColor: pressed ? (variantBackground + 'cc') : variantBackground, opacity: disabled ? 0.6 : 1 },
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
