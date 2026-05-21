const targetThresholdHeight = 0.28;

export function getTimelineMaxVolume(volumeThreshold: number, volumes: readonly number[]) {
  const thresholdScale = volumeThreshold > 0
    ? volumeThreshold / targetThresholdHeight
    : 0.05;

  return Math.max(thresholdScale, ...volumes, 0.001);
}

export function getTimelineValueY(args: {
  value: number;
  maxVolume: number;
  heightPx: number;
}) {
  const ratio = args.maxVolume > 0
    ? Math.min(1, Math.max(0, args.value) / args.maxVolume)
    : 0;

  return args.heightPx - ratio * args.heightPx;
}

export function getTimelineStrokeY(args: {
  value: number;
  maxVolume: number;
  heightPx: number;
}) {
  const y = getTimelineValueY(args);
  return Math.max(0.5, Math.min(args.heightPx - 0.5, Math.round(y) + 0.5));
}
