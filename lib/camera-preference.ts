const CAMERA_COOKIE = "astro-npf-camera";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function readCameraPreference(validCameraIds: readonly string[]) {
  if (typeof document === "undefined") return null;
  const encodedValue = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CAMERA_COOKIE}=`))
    ?.slice(CAMERA_COOKIE.length + 1);
  if (!encodedValue) return null;

  try {
    const cameraId = decodeURIComponent(encodedValue);
    return validCameraIds.includes(cameraId) ? cameraId : null;
  } catch {
    return null;
  }
}

export function saveCameraPreference(cameraId: string) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const path = window.location.pathname.startsWith("/astrophoto") ? "/astrophoto" : "/";
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CAMERA_COOKIE}=${encodeURIComponent(cameraId)}; Max-Age=${ONE_YEAR_SECONDS}; Path=${path}; SameSite=Lax${secure}`;
}
