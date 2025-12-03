import { Platform } from 'react-native';
import { scale } from './scale';

export const Shadow = {
  // subtle shadows for small phone surfaces
  small: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: Math.round(scale(1)) }, shadowOpacity: 0.05, shadowRadius: Math.round(scale(2)) },
    android: { elevation: Math.round(scale(1)) }
  }),
  // medium depth
  medium: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: Math.round(scale(2)) }, shadowOpacity: 0.07, shadowRadius: Math.round(scale(3)) },
    android: { elevation: Math.round(scale(3)) }
  }),
  // larger depth for overlays and modals
  large: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: Math.round(scale(4)) }, shadowOpacity: 0.10, shadowRadius: Math.round(scale(5)) },
    android: { elevation: Math.round(scale(6)) }
  }),
};

export default { Shadow };
