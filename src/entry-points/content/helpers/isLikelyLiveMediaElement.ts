export function isLikelyLiveMediaElement(
  element: Pick<HTMLMediaElement, "duration">
): boolean {
  return element.duration === Infinity;
}
