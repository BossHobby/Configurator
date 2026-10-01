/** Receiver channels use the firmware's unsigned 16-bit range. */
export function receiverChannelPercent(value: number): number {
  return Math.round((Math.max(0, Math.min(65535, value)) / 65535) * 100);
}

export function auxRangeActive(
  value: number | undefined,
  min: number,
  max: number,
): boolean {
  return (
    value !== undefined &&
    (min !== 0 || max !== 0) &&
    value >= min &&
    value <= max
  );
}
