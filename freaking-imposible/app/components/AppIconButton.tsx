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

export default function AppIconButton({ name, size = 18, color, style, variant = 'ghost', accessibilityLabel, ...rest }: Props) {
  const { colors } = useTheme();
  const iconColor = color ?? (variant === 'primary' ? colors.card : variant === 'danger' ? colors.card : variant === 'success' ? colors.card : colors.text);
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'success' ? colors.success : 'transparent';
  return (
    <AppButton {...rest} variant={variant} style={[{ padding: 6, minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: bg }, style]}>
      <Ionicons name={name} size={size} color={iconColor} accessibilityLabel={accessibilityLabel} />
    </AppButton>
  );
}
