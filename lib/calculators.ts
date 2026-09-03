const ARCSECONDS_PER_RADIAN = 206_264.806;
const SIDEREAL_DAY_SECONDS = 86_164.0905;

export const SIDEREAL_RATE_ARCSEC_PER_SECOND =
  (360 * 60 * 60) / SIDEREAL_DAY_SECONDS;

function positive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function fieldOfView(sensorSizeMm: number, focalLengthMm: number) {
  const sensor = positive(sensorSizeMm, 1);
  const focal = positive(focalLengthMm, 1);
  return (2 * Math.atan(sensor / (2 * focal)) * 180) / Math.PI;
}

export function pixelScale(pixelSizeMicrons: number, focalLengthMm: number) {
  const pixelMm = positive(pixelSizeMicrons, 1) / 1_000;
  const focal = positive(focalLengthMm, 1);
  return 2 * Math.atan(pixelMm / (2 * focal)) * ARCSECONDS_PER_RADIAN;
}

export function starDriftPixels(
  exposureSeconds: number,
  declinationDegrees: number,
  arcsecondsPerPixel: number,
) {
  const exposure = Math.max(0, Number.isFinite(exposureSeconds) ? exposureSeconds : 0);
  const declination = Math.min(90, Math.abs(Number.isFinite(declinationDegrees) ? declinationDegrees : 0));
  const scale = positive(arcsecondsPerPixel, 1);
  const angularDrift = SIDEREAL_RATE_ARCSEC_PER_SECOND * Math.cos((declination * Math.PI) / 180) * exposure;
  return { angularDrift, pixels: angularDrift / scale };
}

export type SamplingAssessment = "Under-sampled" | "Balanced" | "Over-sampled";

export function samplingAssessment(seeingArcseconds: number, arcsecondsPerPixel: number) {
  const pixelsPerFwhm = positive(seeingArcseconds, 1) / positive(arcsecondsPerPixel, 1);
  let assessment: SamplingAssessment = "Balanced";
  if (pixelsPerFwhm < 2) assessment = "Under-sampled";
  if (pixelsPerFwhm > 4) assessment = "Over-sampled";
  return { pixelsPerFwhm, assessment };
}

export function integrationPlan({
  subExposureSeconds,
  frames,
  rejectPercent,
  overheadSeconds,
}: {
  subExposureSeconds: number;
  frames: number;
  rejectPercent: number;
  overheadSeconds: number;
}) {
  const sub = positive(subExposureSeconds, 1);
  const capturedFrames = Math.max(1, Math.floor(positive(frames, 1)));
  const reject = Math.min(100, Math.max(0, Number.isFinite(rejectPercent) ? rejectPercent : 0));
  const overhead = Math.max(0, Number.isFinite(overheadSeconds) ? overheadSeconds : 0);
  const usableFrames = Math.max(0, Math.floor(capturedFrames * (1 - reject / 100)));
  const integrationSeconds = usableFrames * sub;
  const sessionSeconds = capturedFrames * sub + Math.max(0, capturedFrames - 1) * overhead;
  const dutyCycle = sessionSeconds > 0 ? (capturedFrames * sub) / sessionSeconds : 0;
  return { capturedFrames, usableFrames, integrationSeconds, sessionSeconds, dutyCycle };
}
