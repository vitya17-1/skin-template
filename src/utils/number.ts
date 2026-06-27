export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function mm(value: number) {
  return `${Math.round(value * 10) / 10} mm`;
}
