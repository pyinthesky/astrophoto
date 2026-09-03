export const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
export const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export function pixelPitch(sensorWidthMm: number, imageWidthPx: number) {
  return (sensorWidthMm / imageWidthPx) * 1000;
}

export function fullNpf(
  aperture: number,
  focalLengthMm: number,
  pitchMicrons: number,
  declinationDegrees: number,
  accuracy = 1,
) {
  const declination = Math.min(89.5, Math.abs(declinationDegrees));
  return (
    (accuracy *
      (16.9 * aperture + 0.1 * focalLengthMm + 13.7 * pitchMicrons)) /
    (focalLengthMm * Math.cos(toRadians(declination)))
  );
}

export function simplifiedNpf(
  aperture: number,
  focalLengthMm: number,
  pitchMicrons: number,
) {
  return (35 * aperture + 30 * pitchMicrons) / focalLengthMm;
}

export function rule500(focalLengthMm: number, sensorWidthMm: number) {
  return 500 / (focalLengthMm * (36 / sensorWidthMm));
}

export function fourCropRule(focalLengthMm: number, sensorWidthMm: number) {
  const crop = 36 / sensorWidthMm;
  return ((4 - crop) * 100) / focalLengthMm;
}

type FrameCell = {
  row: number;
  column: number;
  declination: number;
  exposure: number;
};

export function frameMap({
  latitude,
  azimuth,
  altitude,
  focalLength,
  sensorWidth,
  sensorHeight,
  aperture,
  pitch,
  accuracy,
  portrait,
}: {
  latitude: number;
  azimuth: number;
  altitude: number;
  focalLength: number;
  sensorWidth: number;
  sensorHeight: number;
  aperture: number;
  pitch: number;
  accuracy: number;
  portrait: boolean;
}) {
  const width = portrait ? sensorHeight : sensorWidth;
  const height = portrait ? sensorWidth : sensorHeight;
  const halfHorizontal = Math.atan(width / (2 * focalLength));
  const halfVertical = Math.atan(height / (2 * focalLength));
  const h = toRadians(altitude);
  const a = toRadians(azimuth);
  const phi = toRadians(latitude);

  const center = {
    east: Math.cos(h) * Math.sin(a),
    north: Math.cos(h) * Math.cos(a),
    up: Math.sin(h),
  };
  const right = { east: Math.cos(a), north: -Math.sin(a), up: 0 };
  const top = {
    east: -Math.sin(h) * Math.sin(a),
    north: -Math.sin(h) * Math.cos(a),
    up: Math.cos(h),
  };

  const cells: FrameCell[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const x = (column - 1) * halfHorizontal * 0.68;
      const y = (1 - row) * halfVertical * 0.68;
      const east = center.east + Math.tan(x) * right.east + Math.tan(y) * top.east;
      const north = center.north + Math.tan(x) * right.north + Math.tan(y) * top.north;
      const up = center.up + Math.tan(x) * right.up + Math.tan(y) * top.up;
      const length = Math.hypot(east, north, up);
      const altitudeAtPoint = Math.asin(up / length);
      const azimuthAtPoint = Math.atan2(east / length, north / length);
      const sinDeclination =
        Math.sin(phi) * Math.sin(altitudeAtPoint) +
        Math.cos(phi) * Math.cos(altitudeAtPoint) * Math.cos(azimuthAtPoint);
      const declination = toDegrees(Math.asin(Math.max(-1, Math.min(1, sinDeclination))));
      cells.push({
        row,
        column,
        declination,
        exposure: fullNpf(aperture, focalLength, pitch, declination, accuracy),
      });
    }
  }
  return cells;
}

export function formatSeconds(seconds: number) {
  if (!Number.isFinite(seconds)) return "—";
  if (seconds < 1) return `${seconds.toFixed(2)} s`;
  if (seconds < 10) return `${seconds.toFixed(1)} s`;
  return `${Math.round(seconds)} s`;
}

