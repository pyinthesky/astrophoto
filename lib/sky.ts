import {
  Body,
  Equator,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  SearchAltitude,
  SearchRiseSet,
} from "astronomy-engine";

export type EquatorialTarget = {
  id: string;
  name: string;
  ra: number;
  dec: number;
  magnitude: number;
  kind: "star" | "milky-way";
};

export type HorizontalTarget = EquatorialTarget & {
  altitude: number;
  azimuth: number;
};

export const milkyWayCore: EquatorialTarget = {
  id: "milky-way-core",
  name: "Milky Way core",
  ra: 17.7611,
  dec: -28.9362,
  magnitude: -1,
  kind: "milky-way",
};

// J2000 coordinates for a compact naked-eye guide rather than a full planetarium catalogue.
export const brightStars: EquatorialTarget[] = [
  { id: "sirius", name: "Sirius", ra: 6.7525, dec: -16.7161, magnitude: -1.46, kind: "star" },
  { id: "canopus", name: "Canopus", ra: 6.3992, dec: -52.6957, magnitude: -0.74, kind: "star" },
  { id: "arcturus", name: "Arcturus", ra: 14.261, dec: 19.1824, magnitude: -0.05, kind: "star" },
  { id: "vega", name: "Vega", ra: 18.6156, dec: 38.7837, magnitude: 0.03, kind: "star" },
  { id: "capella", name: "Capella", ra: 5.2782, dec: 45.998, magnitude: 0.08, kind: "star" },
  { id: "rigel", name: "Rigel", ra: 5.2423, dec: -8.2016, magnitude: 0.13, kind: "star" },
  { id: "procyon", name: "Procyon", ra: 7.655, dec: 5.225, magnitude: 0.34, kind: "star" },
  { id: "betelgeuse", name: "Betelgeuse", ra: 5.9195, dec: 7.4071, magnitude: 0.5, kind: "star" },
  { id: "achernar", name: "Achernar", ra: 1.6286, dec: -57.2368, magnitude: 0.46, kind: "star" },
  { id: "hadar", name: "Hadar", ra: 14.0637, dec: -60.373, magnitude: 0.61, kind: "star" },
  { id: "altair", name: "Altair", ra: 19.8464, dec: 8.8683, magnitude: 0.76, kind: "star" },
  { id: "acrux", name: "Acrux", ra: 12.4433, dec: -63.0991, magnitude: 0.77, kind: "star" },
  { id: "aldebaran", name: "Aldebaran", ra: 4.5987, dec: 16.5093, magnitude: 0.86, kind: "star" },
  { id: "antares", name: "Antares", ra: 16.4901, dec: -26.432, magnitude: 0.96, kind: "star" },
  { id: "spica", name: "Spica", ra: 13.4199, dec: -11.1614, magnitude: 0.98, kind: "star" },
  { id: "pollux", name: "Pollux", ra: 7.7553, dec: 28.0262, magnitude: 1.14, kind: "star" },
  { id: "fomalhaut", name: "Fomalhaut", ra: 22.9608, dec: -29.6222, magnitude: 1.16, kind: "star" },
  { id: "deneb", name: "Deneb", ra: 20.6905, dec: 45.2803, magnitude: 1.25, kind: "star" },
  { id: "regulus", name: "Regulus", ra: 10.1395, dec: 11.9672, magnitude: 1.35, kind: "star" },
  { id: "castor", name: "Castor", ra: 7.5767, dec: 31.8883, magnitude: 1.58, kind: "star" },
];

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const degrees = (value: number) => (value * 180) / Math.PI;
const normalizeDegrees = (value: number) => ((value % 360) + 360) % 360;

function julianDate(date: Date) {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

function localSiderealDegrees(date: Date, longitude: number) {
  const jd = julianDate(date);
  const t = (jd - 2_451_545) / 36_525;
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2_451_545) +
    0.000387933 * t * t -
    (t * t * t) / 38_710_000;
  return normalizeDegrees(gmst + longitude);
}

export function equatorialToHorizontal(
  raHours: number,
  decDegrees: number,
  date: Date,
  latitude: number,
  longitude: number,
) {
  const hourAngle = radians(normalizeDegrees(localSiderealDegrees(date, longitude) - raHours * 15));
  const dec = radians(decDegrees);
  const lat = radians(latitude);
  const altitude = Math.asin(
    Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(hourAngle),
  );
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat),
  );
  return {
    altitude: degrees(altitude),
    azimuth: normalizeDegrees(degrees(azimuth) + 180),
  };
}

export function targetPosition(
  target: EquatorialTarget,
  date: Date,
  latitude: number,
  longitude: number,
): HorizontalTarget {
  return {
    ...target,
    ...equatorialToHorizontal(target.ra, target.dec, date, latitude, longitude),
  };
}

function galacticToEquatorial(longitudeDegrees: number, latitudeDegrees = 0) {
  const l = radians(longitudeDegrees);
  const b = radians(latitudeDegrees);
  const xg = Math.cos(b) * Math.cos(l);
  const yg = Math.cos(b) * Math.sin(l);
  const zg = Math.sin(b);

  // Transpose of the IAU J2000 equatorial-to-galactic rotation matrix.
  const x = -0.0548755604 * xg + 0.4941094279 * yg - 0.867666149 * zg;
  const y = -0.8734370902 * xg - 0.44482963 * yg - 0.1980763734 * zg;
  const z = -0.4838350155 * xg + 0.7469822445 * yg + 0.4559837762 * zg;

  return {
    ra: normalizeDegrees(degrees(Math.atan2(y, x))) / 15,
    dec: degrees(Math.asin(Math.max(-1, Math.min(1, z)))),
  };
}

export function milkyWayPlane(date: Date, latitude: number, longitude: number) {
  return Array.from({ length: 91 }, (_, index) => {
    const galacticLongitude = index * 4;
    const equatorial = galacticToEquatorial(galacticLongitude);
    return {
      galacticLongitude,
      ...equatorial,
      ...equatorialToHorizontal(equatorial.ra, equatorial.dec, date, latitude, longitude),
    };
  });
}

function bodyPosition(body: Body, date: Date, observer: Observer) {
  const equatorial = Equator(body, date, observer, true, true);
  const horizontal = Horizon(date, observer, equatorial.ra, equatorial.dec, "normal");
  return {
    altitude: horizontal.altitude,
    azimuth: horizontal.azimuth,
    dec: horizontal.dec,
  };
}

function nightAnchor(date: Date) {
  const anchor = new Date(date);
  if (anchor.getHours() < 12) anchor.setDate(anchor.getDate() - 1);
  anchor.setHours(12, 0, 0, 0);
  return anchor;
}

export function phaseName(angle: number) {
  if (angle < 22.5 || angle >= 337.5) return "New moon";
  if (angle < 67.5) return "Waxing crescent";
  if (angle < 112.5) return "First quarter";
  if (angle < 157.5) return "Waxing gibbous";
  if (angle < 202.5) return "Full moon";
  if (angle < 247.5) return "Waning gibbous";
  if (angle < 292.5) return "Last quarter";
  return "Waning crescent";
}

export function compassDirection(azimuth: number) {
  const points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return points[Math.round(normalizeDegrees(azimuth) / 22.5) % 16];
}

export function lightState(sunAltitude: number) {
  if (sunAltitude >= 0) return "Daylight";
  if (sunAltitude >= -6) return "Civil twilight";
  if (sunAltitude >= -12) return "Nautical twilight";
  if (sunAltitude >= -18) return "Astronomical twilight";
  return "Astronomical night";
}

export function buildSkySnapshot(date: Date, latitude: number, longitude: number) {
  const observer = new Observer(latitude, longitude, 0);
  const sun = bodyPosition(Body.Sun, date, observer);
  const moon = bodyPosition(Body.Moon, date, observer);
  const illumination = Illumination(Body.Moon, date);
  const targets = [milkyWayCore, ...brightStars].map((target) =>
    targetPosition(target, date, latitude, longitude),
  );

  return {
    sun,
    moon,
    moonIllumination: illumination.phase_fraction * 100,
    moonPhase: phaseName(MoonPhase(date)),
    targets,
    plane: milkyWayPlane(date, latitude, longitude),
    light: lightState(sun.altitude),
  };
}

export function buildNightSummary(date: Date, latitude: number, longitude: number) {
  const observer = new Observer(latitude, longitude, 0);
  const anchor = nightAnchor(date);
  const dusk = SearchAltitude(Body.Sun, observer, -1, anchor, 1.5, -18)?.date ?? null;
  const dawnStart = dusk ? new Date(dusk.getTime() + 60_000) : anchor;
  const dawn = SearchAltitude(Body.Sun, observer, +1, dawnStart, 1.5, -18)?.date ?? null;
  const moonrise = SearchRiseSet(Body.Moon, observer, +1, anchor, 1.25)?.date ?? null;
  const moonset = SearchRiseSet(Body.Moon, observer, -1, anchor, 1.25)?.date ?? null;

  const sampleStart = dusk ?? anchor;
  const sampleEnd = dawn ?? new Date(anchor.getTime() + 24 * 60 * 60_000);
  let corePeak: { date: Date; altitude: number; azimuth: number } | null = null;
  const visible: Array<{ date: Date; altitude: number; azimuth: number }> = [];
  for (let time = sampleStart.getTime(); time <= sampleEnd.getTime(); time += 10 * 60_000) {
    const sampleDate = new Date(time);
    const core = targetPosition(milkyWayCore, sampleDate, latitude, longitude);
    if (!corePeak || core.altitude > corePeak.altitude) {
      corePeak = { date: sampleDate, altitude: core.altitude, azimuth: core.azimuth };
    }
    if (core.altitude >= 10 && bodyPosition(Body.Sun, sampleDate, observer).altitude <= -18) {
      visible.push({ date: sampleDate, altitude: core.altitude, azimuth: core.azimuth });
    }
  }

  return {
    dusk,
    dawn,
    moonrise,
    moonset,
    corePeak,
    coreVisibleFrom: visible[0]?.date ?? null,
    coreVisibleUntil: visible.at(-1)?.date ?? null,
  };
}
