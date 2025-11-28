import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Shadow } from '../utils/styles';
import { useTheme } from '../_context/ThemeProvider';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  disabled?: boolean;
  style?: any;
}

export default function AppButton({ children, onPress, variant = 'primary', disabled, style }: Props) {
  const { colors, sizing, fonts } = useTheme();
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.card : 'transparent';
  const contentColor = variant === 'primary' ? '#fff' : variant === 'danger' ? '#fff' : variant === 'success' ? '#fff' : colors.text;
  // variant colors
  const variantBackground = variant === 'danger' ? colors.danger : variant === 'success' ? colors.success : backgroundColor;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      android_ripple={{ color: '#0000001a' }}
      style={({ pressed }) => [
        styles.button,
        { borderRadius: sizing.radius, paddingVertical: Math.round(sizing.gutter * 0.6), paddingHorizontal: Math.round(sizing.gutter * 1.2) },
        { backgroundColor: pressed ? variantBackground + 'cc' : variantBackground, opacity: disabled ? 0.6 : 1 },
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && { backgroundColor: 'transparent' },
        style,
        (Shadow.small as any)
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.text, { color: contentColor, fontSize: fonts.sm }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
  secondary: { borderWidth: 1, borderColor: '#e6e6e6' },
  iosShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  androidShadow: { elevation: 3 },
});
