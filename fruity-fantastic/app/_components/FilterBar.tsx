import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../_context/ThemeProvider';

interface Props { value: number; onChange: (v: number) => void }

export default function FilterBar({ value, onChange }: Props) {
  const { colors, sizing } = useTheme();
  const inputWidth = Math.round(sizing.gutter * 5);
  return (
    <View style={[styles.row, { gap: Math.round(sizing.gutter / 3), marginBottom: sizing.gutter / 1.4 }]}>
      <Text style={{ color: colors.muted, fontWeight: '600' }}>Min Rating: {value.toFixed(1)}</Text>
      <TextInput
        value={String(value)}
        onChangeText={(t) => {
          const v = Number(t);
          if (!isNaN(v)) onChange(v);
        }}
        keyboardType="numeric"
        style={{ width: inputWidth, borderWidth: 1, marginLeft: Math.round(sizing.gutter * 0.6), padding: Math.round(sizing.gutter * 0.25), borderRadius: Math.round(sizing.radius / 1.5), backgroundColor: colors.card }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
