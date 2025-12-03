import React from 'react';

// Simple render counter utility for debugging
const renderCounts = new Map<string, number>();

export function incrementRenderCount(key: string) {
  const prev = renderCounts.get(key) ?? 0;
  renderCounts.set(key, prev + 1);
  return renderCounts.get(key) as number;
}

export function getRenderCount(key: string) {
  return renderCounts.get(key) ?? 0;
}

export function useRenderCounter(key: string, showOverlay = false) {
  // Increment on each render. Use a ref so components can read the updated value.
  const val = incrementRenderCount(key);
  const countRef = React.useRef<number>(val);
  countRef.current = val;
  if (showOverlay && typeof window !== 'undefined' && __DEV__) {
    console.log(`[render] ${key}: ${val}`);
  }
  return countRef;
}

export default { incrementRenderCount, getRenderCount, useRenderCounter };
