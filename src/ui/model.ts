export type Appearance = "system" | "light" | "dark";
export function readAppearance(
  value: string | null,
  legacy: string | null,
): Appearance {
  if (value === "system" || value === "light" || value === "dark") return value;
  if (legacy === "true") return "dark";
  if (legacy === "false") return "light";
  return "system";
}
export function resolveAppearance(value: Appearance, systemDark: boolean) {
  return value === "system" ? (systemDark ? "dark" : "light") : value;
}
export function channelPosition(value: number, min: number, max: number) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    max <= min
  )
    return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}
