import React from 'react';
import { ViewStyle, StyleProp, PressableProps } from 'react-native';
import AppButton from './AppButton';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../_context/ThemeProvider';

interface Props extends PressableProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle> | any;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  accessibilityLabel?: string;
}

export default function AppIconButton({ name, size: sizeProp, color, style, variant = 'ghost', accessibilityLabel, ...rest }: Props) {
  const { colors, sizing, fonts } = useTheme();
  const size = sizeProp ?? Math.max(16, fonts.md - 2);
  const iconColor = color ?? (variant === 'primary' ? colors.card : variant === 'danger' ? colors.card : variant === 'success' ? colors.card : colors.text);
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'success' ? colors.success : 'transparent';
  const minDim = Math.round(Math.max(36, sizing.gutter * 3));
  return (
    <AppButton {...rest} variant={variant} style={[{ padding: Math.max(2, Math.round(sizing.gutter * 0.35)), minWidth: minDim, minHeight: minDim, alignItems: 'center', justifyContent: 'center', borderRadius: Math.round(minDim / 2), backgroundColor: variant === 'ghost' ? 'transparent' : bg }, style]}>
      <Ionicons name={name} size={size} color={iconColor} accessibilityLabel={accessibilityLabel} />
    </AppButton>
  );
}
