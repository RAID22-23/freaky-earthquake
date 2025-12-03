import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import AppIconButton from './AppIconButton';
import { useTheme } from '../_context/ThemeProvider';

interface Props { value: number; onChange: (v: number) => void }

export default function FilterBar({ value, onChange }: Props) {
  const { colors, sizing, compact } = useTheme();
  const inputWidth = Math.round(sizing.gutter * 5);
  return (
    <View style={[styles.row, { marginBottom: sizing.gutter / 1.4 }]}>
      <Text style={{ color: colors.muted, fontWeight: '600' }}>{compact ? `Min: ${value.toFixed(1)}` : `Min Rating: ${value.toFixed(1)}`}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Math.round(sizing.gutter * 0.5) }}>
        <AppIconButton name='remove' size={18} onPress={() => onChange(Math.max(0, Number((value - 0.5).toFixed(1))))} variant='ghost' />
        <TextInput
        value={String(value)}
        onChangeText={(t) => {
          const v = Number(t);
          if (!isNaN(v)) onChange(v);
        }}
        keyboardType="numeric"
        style={{ width: inputWidth, borderWidth: 1, borderColor: colors.muted, marginLeft: Math.round(sizing.gutter * 0.6), padding: Math.round(sizing.gutter * 0.25), borderRadius: Math.round(sizing.radius / 1.5), backgroundColor: colors.card }}
      />
        <AppIconButton name='add' size={18} onPress={() => onChange(Math.min(10, Number((value + 0.5).toFixed(1))))} variant='ghost' style={{ marginLeft: Math.round(sizing.gutter * 0.5) }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
