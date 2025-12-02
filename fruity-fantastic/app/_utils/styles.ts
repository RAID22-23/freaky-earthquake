import { Platform } from 'react-native';

export const Shadow = {
  small: Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 }, android: { elevation: 2 } }),
  medium: Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 }, android: { elevation: 4 } }),
  large: Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 6 }, android: { elevation: 6 } }),
};

export default { Shadow };
