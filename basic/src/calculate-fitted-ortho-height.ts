interface Dimensions {
  height: number;
  width: number;
}

export function calculateFittedOrthoHeight(
  viewport: Dimensions,
  safeArea: Dimensions,
): number {
  const heightRequiredByWidth = safeArea.width * viewport.height / viewport.width;
  return Math.max(safeArea.height, heightRequiredByWidth) / 2;
}
