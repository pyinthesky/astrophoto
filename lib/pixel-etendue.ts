export type PixelEtendueSetup = {
  apertureMm: number;
  obstructionMm: number;
  lossPercent: number;
  pixelScaleArcsec: number;
};

export type PixelEtendueComparison = {
  setupA: { collectingFactor: number; etendue: number };
  setupB: { collectingFactor: number; etendue: number };
  lightRatioAtoB: number;
  snrRatioAtoB: number;
  exposureBSeconds: number;
};

export function scaleFromPixelAndFocalLength(pixelSizeMicrons: number, focalLengthMm: number) {
  if (!Number.isFinite(pixelSizeMicrons) || pixelSizeMicrons <= 0) return null;
  if (!Number.isFinite(focalLengthMm) || focalLengthMm <= 0) return null;
  return (206.265 * pixelSizeMicrons) / focalLengthMm;
}

function setupFactors(setup: PixelEtendueSetup) {
  const { apertureMm, obstructionMm, lossPercent, pixelScaleArcsec } = setup;
  if (!Number.isFinite(apertureMm) || apertureMm <= 0) return null;
  if (!Number.isFinite(obstructionMm) || obstructionMm < 0 || obstructionMm >= apertureMm) return null;
  if (!Number.isFinite(lossPercent) || lossPercent < 0 || lossPercent >= 100) return null;
  if (!Number.isFinite(pixelScaleArcsec) || pixelScaleArcsec <= 0) return null;

  // The common pi/4 area term cancels in an A:B comparison.
  const collectingFactor = (apertureMm ** 2 - obstructionMm ** 2) * (1 - lossPercent / 100);
  return { collectingFactor, etendue: collectingFactor * pixelScaleArcsec ** 2 };
}

export function comparePixelEtendue(
  setupA: PixelEtendueSetup,
  setupB: PixelEtendueSetup,
  referenceExposureASeconds: number,
): PixelEtendueComparison | null {
  const a = setupFactors(setupA);
  const b = setupFactors(setupB);
  if (!a || !b || !Number.isFinite(referenceExposureASeconds) || referenceExposureASeconds <= 0) return null;

  const lightRatioAtoB = a.etendue / b.etendue;
  return {
    setupA: a,
    setupB: b,
    lightRatioAtoB,
    snrRatioAtoB: Math.sqrt(lightRatioAtoB),
    exposureBSeconds: referenceExposureASeconds * lightRatioAtoB,
  };
}
