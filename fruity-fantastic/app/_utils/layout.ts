import { Dimensions } from 'react-native';
import { scale } from './scale';

export function getNumColumns(width?: number, minCardWidth = 260, gap = Math.round(scale(12)), maxCols = 8) {
  const w = width ?? Dimensions.get('window').width;
  const cols = Math.floor((w + gap) / (minCardWidth + gap));
  return Math.min(Math.max(cols, 1), maxCols);
}

export function calcCardWidth(width?: number, numColumns?: number, gap = Math.round(scale(12))) {
  const w = width ?? Dimensions.get('window').width;
  const cols = numColumns ?? getNumColumns(w, undefined, gap);
  return Math.floor((w - (cols + 1) * gap) / cols);
}

export default { getNumColumns, calcCardWidth };
