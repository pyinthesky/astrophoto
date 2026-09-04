export type ExposureValueResult = {
  settingsEv: number;
  sceneEv100: number;
};

function validPositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function calculateExposureValue(aperture: number, shutterSeconds: number, iso: number): ExposureValueResult | null {
  if (!validPositive(aperture) || !validPositive(shutterSeconds) || !validPositive(iso)) return null;
  const settingsEv = Math.log2(aperture ** 2 / shutterSeconds);
  return {
    settingsEv,
    sceneEv100: settingsEv - Math.log2(iso / 100),
  };
}

export function equivalentShutterSeconds({
  aperture,
  shutterSeconds,
  iso,
  targetAperture,
  targetIso,
}: {
  aperture: number;
  shutterSeconds: number;
  iso: number;
  targetAperture: number;
  targetIso: number;
}) {
  if (![aperture, shutterSeconds, iso, targetAperture, targetIso].every(validPositive)) return null;
  return shutterSeconds * (targetAperture / aperture) ** 2 * (iso / targetIso);
}
