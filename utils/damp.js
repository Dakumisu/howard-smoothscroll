function lerpPrecise(start, end, t = 0.5, limit = 0.001) {
  const v = start * (1 - t) + end * t;
  return Math.abs(end - v) < limit ? end : v;
}

export function dampPrecise(a, b, smoothing = 0.5, dt, limit) {
  return lerpPrecise(a, b, 1 - Math.exp(-smoothing * 0.05 * dt), limit);
}
