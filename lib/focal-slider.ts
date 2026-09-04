const MIN_FOCAL_LENGTH = 8;
const MAX_SLIDER_FOCAL_LENGTH = 250;

export function focalLengthToSlider(focalLengthMm: number) {
  const focal = Math.min(MAX_SLIDER_FOCAL_LENGTH, Math.max(MIN_FOCAL_LENGTH, focalLengthMm));
  return (Math.log(focal / MIN_FOCAL_LENGTH) / Math.log(MAX_SLIDER_FOCAL_LENGTH / MIN_FOCAL_LENGTH)) * 100;
}

export function sliderToFocalLength(position: number) {
  const normalized = Math.min(100, Math.max(0, position)) / 100;
  return Math.round(MIN_FOCAL_LENGTH * (MAX_SLIDER_FOCAL_LENGTH / MIN_FOCAL_LENGTH) ** normalized);
}
