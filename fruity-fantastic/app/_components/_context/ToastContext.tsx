import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Shadow } from '../../_utils/styles';
import { useTheme } from '../../_context/ThemeProvider';
import { moderateScale } from '../../_utils/scale';

export type ToastType = 'info' | 'success' | 'error';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { sizing, colors } = useTheme();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setToast(null));
    }, 2200);
  }, [anim]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [Math.round(-moderateScale(sizing.gutter * 1.6)), 0] }) }] }, { top: sizing.gutter, left: sizing.gutter, right: sizing.gutter, paddingHorizontal: Math.round(sizing.gutter * 1.6), paddingVertical: Math.round(sizing.gutter * 0.6), borderRadius: sizing.radius, backgroundColor: colors.card }]} pointerEvents="none">
          <Text style={[styles.message, { color: toast.type === 'error' ? colors.danger : toast.type === 'success' ? colors.success : colors.text }]}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Shadow.medium as any),
  },
  message: { fontWeight: '600' },
});

export default ToastContext;
