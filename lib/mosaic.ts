import { fieldOfView } from "@/lib/calculators";

export type MosaicOrientation = "landscape" | "portrait";

export type MosaicPanel = {
  order: number;
  row: number;
  column: number;
  offsetXArcmin: number;
  offsetYArcmin: number;
  rightAscensionHours: number | null;
  declinationDegrees: number | null;
};

export type MosaicPlan = {
  columns: number;
  rows: number;
  panelCount: number;
  frameWidthArcmin: number;
  frameHeightArcmin: number;
  stepWidthArcmin: number;
  stepHeightArcmin: number;
  mosaicWidthArcmin: number;
  mosaicHeightArcmin: number;
  requiredWidthArcmin: number;
  requiredHeightArcmin: number;
  stitchedWidthPixels: number;
  stitchedHeightPixels: number;
  stitchedMegapixels: number;
  totalCaptureMinutes: number;
  panels: MosaicPanel[];
};

function finitePositive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function panelCountFor(requiredSpan: number, frameSpan: number, step: number) {
  if (requiredSpan <= frameSpan) return 1;
  return Math.max(1, Math.ceil((requiredSpan - frameSpan) / step) + 1);
}

function wrapHours(hours: number) {
  return ((hours % 24) + 24) % 24;
}

export function calculateMosaicPlan({
  sensorWidthMm,
  sensorHeightMm,
  imageWidthPixels,
  imageHeightPixels,
  focalLengthMm,
  targetWidthArcmin,
  targetHeightArcmin,
  targetAngleDegrees,
  overlapPercent,
  marginPercent,
  orientation,
  rightAscensionHours = null,
  declinationDegrees = null,
  integrationMinutesPerPanel = 60,
  transitionMinutes = 5,
}: {
  sensorWidthMm: number;
  sensorHeightMm: number;
  imageWidthPixels: number;
  imageHeightPixels: number;
  focalLengthMm: number;
  targetWidthArcmin: number;
  targetHeightArcmin: number;
  targetAngleDegrees: number;
  overlapPercent: number;
  marginPercent: number;
  orientation: MosaicOrientation;
  rightAscensionHours?: number | null;
  declinationDegrees?: number | null;
  integrationMinutesPerPanel?: number;
  transitionMinutes?: number;
}): MosaicPlan {
  const focalLength = finitePositive(focalLengthMm, 1);
  const landscape = orientation === "landscape";
  const sensorWidth = landscape ? finitePositive(sensorWidthMm, 1) : finitePositive(sensorHeightMm, 1);
  const sensorHeight = landscape ? finitePositive(sensorHeightMm, 1) : finitePositive(sensorWidthMm, 1);
  const imageWidth = landscape ? finitePositive(imageWidthPixels, 1) : finitePositive(imageHeightPixels, 1);
  const imageHeight = landscape ? finitePositive(imageHeightPixels, 1) : finitePositive(imageWidthPixels, 1);
  const frameWidthArcmin = fieldOfView(sensorWidth, focalLength) * 60;
  const frameHeightArcmin = fieldOfView(sensorHeight, focalLength) * 60;
  const overlap = clamp(Number.isFinite(overlapPercent) ? overlapPercent : 0, 0, 90) / 100;
  const margin = clamp(Number.isFinite(marginPercent) ? marginPercent : 0, 0, 200) / 100;
  const targetWidth = finitePositive(targetWidthArcmin, 1);
  const targetHeight = finitePositive(targetHeightArcmin, 1);
  const angle = (Number.isFinite(targetAngleDegrees) ? targetAngleDegrees : 0) * Math.PI / 180;
  const rotatedWidth = Math.abs(targetWidth * Math.cos(angle)) + Math.abs(targetHeight * Math.sin(angle));
  const rotatedHeight = Math.abs(targetWidth * Math.sin(angle)) + Math.abs(targetHeight * Math.cos(angle));
  const requiredWidthArcmin = rotatedWidth * (1 + margin * 2);
  const requiredHeightArcmin = rotatedHeight * (1 + margin * 2);
  const stepWidthArcmin = frameWidthArcmin * (1 - overlap);
  const stepHeightArcmin = frameHeightArcmin * (1 - overlap);
  const columns = panelCountFor(requiredWidthArcmin, frameWidthArcmin, stepWidthArcmin);
  const rows = panelCountFor(requiredHeightArcmin, frameHeightArcmin, stepHeightArcmin);
  const mosaicWidthArcmin = frameWidthArcmin + (columns - 1) * stepWidthArcmin;
  const mosaicHeightArcmin = frameHeightArcmin + (rows - 1) * stepHeightArcmin;
  const stitchedWidthPixels = imageWidth + (columns - 1) * imageWidth * (1 - overlap);
  const stitchedHeightPixels = imageHeight + (rows - 1) * imageHeight * (1 - overlap);
  const panelCount = columns * rows;
  const integration = finitePositive(integrationMinutesPerPanel, 1);
  const transition = Math.max(0, Number.isFinite(transitionMinutes) ? transitionMinutes : 0);
  const totalCaptureMinutes = panelCount * integration + Math.max(0, panelCount - 1) * transition;
  const hasCoordinates = Number.isFinite(rightAscensionHours) && Number.isFinite(declinationDegrees);
  const centerDeclination = hasCoordinates ? clamp(declinationDegrees as number, -90, 90) : 0;
  const cosineDeclination = Math.max(0.1, Math.abs(Math.cos(centerDeclination * Math.PI / 180)));
  const panels: MosaicPanel[] = [];
  let order = 1;

  for (let row = 0; row < rows; row += 1) {
    const columnsInCaptureOrder = row % 2 === 0
      ? Array.from({ length: columns }, (_, index) => index)
      : Array.from({ length: columns }, (_, index) => columns - index - 1);
    for (const column of columnsInCaptureOrder) {
      const offsetXArcmin = (column - (columns - 1) / 2) * stepWidthArcmin;
      const offsetYArcmin = ((rows - 1) / 2 - row) * stepHeightArcmin;
      panels.push({
        order,
        row,
        column,
        offsetXArcmin,
        offsetYArcmin,
        rightAscensionHours: hasCoordinates
          ? wrapHours((rightAscensionHours as number) + offsetXArcmin / (60 * 15 * cosineDeclination))
          : null,
        declinationDegrees: hasCoordinates ? clamp(centerDeclination + offsetYArcmin / 60, -90, 90) : null,
      });
      order += 1;
    }
  }

  return {
    columns,
    rows,
    panelCount,
    frameWidthArcmin,
    frameHeightArcmin,
    stepWidthArcmin,
    stepHeightArcmin,
    mosaicWidthArcmin,
    mosaicHeightArcmin,
    requiredWidthArcmin,
    requiredHeightArcmin,
    stitchedWidthPixels,
    stitchedHeightPixels,
    stitchedMegapixels: stitchedWidthPixels * stitchedHeightPixels / 1_000_000,
    totalCaptureMinutes,
    panels,
  };
}
