export interface OsdElement {
  id: string;
  label: string;
  text: string;
  enabled: boolean;
  x: number;
  y: number;
  invert: boolean;
}
export interface OsdMock {
  callsign: string;
  elements: OsdElement[];
}
export function osdPosition(x: number, y: number, width: number) {
  x = Number.isFinite(x) ? x : 0;
  y = Number.isFinite(y) ? y : 0;
  width = Number.isFinite(width) ? width : 1;
  return {
    x: Math.max(
      0,
      Math.min(30 - Math.min(30, Math.max(1, width)), Math.round(x)),
    ),
    y: Math.max(0, Math.min(15, Math.round(y))),
  };
}
