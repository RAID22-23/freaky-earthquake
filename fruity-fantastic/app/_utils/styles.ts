import { Platform } from 'react-native';
import { scale } from './scale';

export const Shadow = {
  small: Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: Math.round(scale(1)) }, shadowOpacity: 0.08, shadowRadius: Math.round(scale(3)) }, android: { elevation: Math.round(scale(2)) } }),
  medium: Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: Math.round(scale(2)) }, shadowOpacity: 0.12, shadowRadius: Math.round(scale(4)) }, android: { elevation: Math.round(scale(4)) } }),
  large: Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: Math.round(scale(4)) }, shadowOpacity: 0.18, shadowRadius: Math.round(scale(6)) }, android: { elevation: Math.round(scale(6)) } }),
};

export default { Shadow };
