export function getMusicAwareSilenceVolumeThreshold(volumeThreshold: number): number {
  return Math.max(0, Math.min(volumeThreshold, volumeThreshold * 0.45));
}
