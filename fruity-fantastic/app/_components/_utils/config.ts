import Constants from 'expo-constants';

export const EXPO_PUBLIC_API_KEY =
  Constants?.expoConfig?.extra?.EXPO_PUBLIC_API_KEY ||
  process.env.EXPO_PUBLIC_API_KEY ||
  "59e7bd5d1a601e53bd390c96861361d3";

export default { EXPO_PUBLIC_API_KEY };
