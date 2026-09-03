import { Body, Equator, Horizon, Illumination, Observer } from "astronomy-engine";
import { milkyWayCore, targetPosition, type EquatorialTarget } from "@/lib/sky";

export type TripTarget = EquatorialTarget & {
  shortName: string;
  description: string;
  season: string;
};

export type TargetNightMetric = {
  id: string;
  name: string;
  bestTime: Date | null;
  peakAltitude: number;
  visibleHours: number;
  moonSeparation: number | null;
  score: number;
};

export type NightPlan = {
  date: Date;
  score: number;
  rating: "Excellent" | "Good" | "Possible" | "Poor";
  darkHours: number;
  moonIllumination: number;
  metrics: TargetNightMetric[];
};

export type ScoutingPlace = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  direction: string;
};

export const tripTargets: TripTarget[] = [
  { ...milkyWayCore, shortName: "Milky Way", description: "Wide-field core and dust lanes", season: "Best season depends on hemisphere" },
  { id: "m31", name: "M31 · Andromeda Galaxy", shortName: "Andromeda", ra: 0.7123, dec: 41.2692, magnitude: 3.44, kind: "star", description: "Large nearby galaxy", season: "Autumn evenings · Northern sky" },
  { id: "m42", name: "M42 · Orion Nebula", shortName: "Orion Nebula", ra: 5.5881, dec: -5.3911, magnitude: 4, kind: "star", description: "Bright beginner-friendly nebula", season: "Winter evenings · Both hemispheres" },
  { id: "m45", name: "M45 · Pleiades", shortName: "Pleiades", ra: 3.79, dec: 24.1167, magnitude: 1.6, kind: "star", description: "Bright blue open cluster", season: "Autumn and winter evenings" },
  { id: "m8", name: "M8 · Lagoon Nebula", shortName: "Lagoon Nebula", ra: 18.0617, dec: -24.3867, magnitude: 6, kind: "star", description: "Emission nebula near the Galactic core", season: "Summer evenings · Northern sky" },
  { id: "ngc7000", name: "NGC 7000 · North America Nebula", shortName: "North America", ra: 20.9797, dec: 44.33, magnitude: 4, kind: "star", description: "Large hydrogen-rich nebula", season: "Summer and autumn evenings · Northern sky" },
  { id: "ngc3372", name: "NGC 3372 · Carina Nebula", shortName: "Carina Nebula", ra: 10.7506, dec: -59.6999, magnitude: 1, kind: "star", description: "Huge southern emission nebula", season: "Southern summer and autumn" },
  { id: "lmc", name: "Large Magellanic Cloud", shortName: "LMC", ra: 5.3929, dec: -69.7561, magnitude: 0.9, kind: "star", description: "Companion galaxy of the Milky Way", season: "Southern spring and summer" },
];

const radians = (degrees: number) => degrees * Math.PI / 180;
const degrees = (value: number) => value * 180 / Math.PI;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function bodyAltitude(body: Body, date: Date, observer: Observer) {
  const equatorial = Equator(body, date, observer, true, true);
  return Horizon(date, observer, equatorial.ra, equatorial.dec, "normal").altitude;
}

function angularSeparation(target: EquatorialTarget, moonRa: number, moonDec: number) {
  const targetDec = radians(target.dec);
  const lunarDec = radians(moonDec);
  const difference = radians((target.ra - moonRa) * 15);
  return degrees(Math.acos(clamp(
    Math.sin(targetDec) * Math.sin(lunarDec) + Math.cos(targetDec) * Math.cos(lunarDec) * Math.cos(difference),
    -1,
    1,
  )));
}

function rating(score: number): NightPlan["rating"] {
  if (score >= 78) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 38) return "Possible";
  return "Poor";
}

export function scoreNight(date: Date, latitude: number, longitude: number, targets: TripTarget[]): NightPlan {
  const observer = new Observer(latitude, longitude, 0);
  const evening = new Date(date);
  evening.setHours(18, 0, 0, 0);
  const morning = new Date(evening);
  morning.setDate(morning.getDate() + 1);
  morning.setHours(6, 0, 0, 0);
  const moonIllumination = Illumination(Body.Moon, evening).phase_fraction * 100;
  const records = targets.map((target) => ({
    target,
    bestScore: 0,
    bestTime: null as Date | null,
    peakAltitude: -90,
    visibleSamples: 0,
    moonSeparation: null as number | null,
  }));
  let darkSamples = 0;

  for (let time = evening.getTime(); time <= morning.getTime(); time += 30 * 60_000) {
    const sample = new Date(time);
    if (bodyAltitude(Body.Sun, sample, observer) > -18) continue;
    darkSamples += 1;
    const moonEquatorial = Equator(Body.Moon, sample, observer, false, true);
    const moonAltitude = bodyAltitude(Body.Moon, sample, observer);

    records.forEach((record) => {
      const position = targetPosition(record.target, sample, latitude, longitude);
      record.peakAltitude = Math.max(record.peakAltitude, position.altitude);
      if (position.altitude >= 20) record.visibleSamples += 1;
      if (position.altitude < 10) return;

      const separation = angularSeparation(record.target, moonEquatorial.ra, moonEquatorial.dec);
      const altitudeQuality = clamp((position.altitude - 10) / 50);
      const moonPenalty = moonAltitude > 0
        ? (moonIllumination / 100) * (0.18 + 0.62 * clamp((90 - separation) / 90))
        : 0;
      const sampleScore = 100 * clamp(altitudeQuality * (1 - moonPenalty));
      if (sampleScore > record.bestScore) {
        record.bestScore = sampleScore;
        record.bestTime = sample;
        record.moonSeparation = separation;
      }
    });
  }

  const metrics = records.map((record) => ({
    id: record.target.id,
    name: record.target.shortName,
    bestTime: record.bestTime,
    peakAltitude: record.peakAltitude,
    visibleHours: record.visibleSamples * 0.5,
    moonSeparation: record.moonSeparation,
    score: Math.round(record.bestScore),
  }));
  const targetAverage = metrics.reduce((sum, metric) => sum + metric.score, 0) / Math.max(1, metrics.length);
  const darknessFactor = clamp((darkSamples * 0.5) / 6);
  const score = Math.round(targetAverage * (0.8 + 0.2 * darknessFactor));

  return { date: evening, score, rating: rating(score), darkHours: darkSamples * 0.5, moonIllumination, metrics };
}

export function rankNights(
  start: Date,
  end: Date,
  stepDays: number,
  latitude: number,
  longitude: number,
  targets: TripTarget[],
) {
  const plans: NightPlan[] = [];
  const cursor = new Date(start);
  cursor.setHours(12, 0, 0, 0);
  const last = new Date(end);
  last.setHours(12, 0, 0, 0);
  while (cursor <= last) {
    plans.push(scoreNight(cursor, latitude, longitude, targets));
    cursor.setDate(cursor.getDate() + stepDays);
  }
  return plans.sort((a, b) => b.score - a.score).slice(0, 8);
}

function haversineKm(latA: number, lonA: number, latB: number, lonB: number) {
  const earthKm = 6371;
  const deltaLat = radians(latB - latA);
  const deltaLon = radians(lonB - lonA);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(value));
}

function bearing(latA: number, lonA: number, latB: number, lonB: number) {
  const y = Math.sin(radians(lonB - lonA)) * Math.cos(radians(latB));
  const x = Math.cos(radians(latA)) * Math.sin(radians(latB)) - Math.sin(radians(latA)) * Math.cos(radians(latB)) * Math.cos(radians(lonB - lonA));
  const angle = (degrees(Math.atan2(y, x)) + 360) % 360;
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(angle / 45) % 8];
}

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function placeCategory(tags: Record<string, string>) {
  if (tags.tourism === "viewpoint") return "Viewpoint";
  if (tags.tourism === "camp_site") return "Campsite";
  if (tags.leisure === "nature_reserve") return "Nature reserve";
  if (tags.boundary === "national_park") return "National park";
  return "Protected area";
}

export async function findScoutingPlaces(latitude: number, longitude: number, radiusKm: number) {
  const roundedLatitude = Number(latitude.toFixed(2));
  const roundedLongitude = Number(longitude.toFixed(2));
  const radiusMeters = Math.round(Math.min(200, Math.max(5, radiusKm)) * 1000);
  const query = `[out:json][timeout:15];(
    nwr(around:${radiusMeters},${roundedLatitude},${roundedLongitude})["tourism"="viewpoint"]["name"];
    nwr(around:${radiusMeters},${roundedLatitude},${roundedLongitude})["tourism"="camp_site"]["name"];
    nwr(around:${radiusMeters},${roundedLatitude},${roundedLongitude})["leisure"="nature_reserve"]["name"];
    nwr(around:${radiusMeters},${roundedLatitude},${roundedLongitude})["boundary"="national_park"]["name"];
    nwr(around:${radiusMeters},${roundedLatitude},${roundedLongitude})["boundary"="protected_area"]["name"];
  );out center 80;`;
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ data: query }),
  });
  if (!response.ok) throw new Error(response.status === 429 || response.status === 504
    ? "The public place-search service is busy. Try again in a few minutes."
    : "Nearby places could not be loaded right now.");
  const data = await response.json() as { elements?: OverpassElement[] };
  const unique = new Map<string, ScoutingPlace>();
  (data.elements ?? []).forEach((element) => {
    const tags = element.tags ?? {};
    if (!tags.name || ["no", "private"].includes(tags.access)) return;
    const placeLatitude = element.lat ?? element.center?.lat;
    const placeLongitude = element.lon ?? element.center?.lon;
    if (placeLatitude === undefined || placeLongitude === undefined) return;
    const distanceKm = haversineKm(latitude, longitude, placeLatitude, placeLongitude);
    const key = `${tags.name.toLowerCase()}|${placeLatitude.toFixed(3)}|${placeLongitude.toFixed(3)}`;
    unique.set(key, {
      id: `${element.type}-${element.id}`,
      name: tags.name,
      category: placeCategory(tags),
      latitude: placeLatitude,
      longitude: placeLongitude,
      distanceKm,
      direction: bearing(latitude, longitude, placeLatitude, placeLongitude),
    });
  });
  return [...unique.values()].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 12);
}
