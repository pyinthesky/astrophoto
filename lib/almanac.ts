import { Body, Equator, Horizon, Illumination, MoonPhase, Observer, SearchAltitude, SearchMoonPhase, SearchRiseSet } from "astronomy-engine";
import { phaseName } from "@/lib/sky";

export type AlmanacDay = {
  date: Date;
  sunrise: Date | null;
  sunset: Date | null;
  civilDawn: Date | null;
  civilDusk: Date | null;
  astronomicalDusk: Date | null;
  astronomicalDawn: Date | null;
  moonrise: Date | null;
  moonset: Date | null;
  moonPhaseAngle: number;
  moonPhase: string;
  moonIllumination: number;
  daylightHours: number;
  astronomicalDarkHours: number;
  moonlessDarkHours: number;
  darkSkyRating: "Excellent" | "Good" | "Fair" | "Bright moon" | "No astro dark";
};

export type MoonPhaseEvent = {
  name: "New moon" | "First quarter" | "Full moon" | "Last quarter";
  date: Date;
  angle: number;
};

function bodyAltitude(body: Body, date: Date, observer: Observer) {
  const equatorial = Equator(body, date, observer, true, true);
  return Horizon(date, observer, equatorial.ra, equatorial.dec, "normal").altitude;
}

function hoursBetween(start: Date | null, end: Date | null) {
  if (!start || !end || end <= start) return 0;
  return (end.getTime() - start.getTime()) / 3_600_000;
}

function rateNight(darkHours: number, moonlessHours: number, illumination: number): AlmanacDay["darkSkyRating"] {
  if (darkHours < 0.5) return "No astro dark";
  if (moonlessHours >= 4 && illumination <= 35) return "Excellent";
  if (moonlessHours >= 2 || illumination <= 30) return "Good";
  if (moonlessHours >= 0.5 || illumination <= 60) return "Fair";
  return "Bright moon";
}

export function buildAlmanacDay(date: Date, latitude: number, longitude: number): AlmanacDay {
  const observer = new Observer(latitude, longitude, 0);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const noon = new Date(dayStart);
  noon.setHours(12);
  const nextNoon = new Date(noon);
  nextNoon.setDate(nextNoon.getDate() + 1);
  const sunrise = SearchRiseSet(Body.Sun, observer, +1, dayStart, 1)?.date ?? null;
  const sunset = SearchRiseSet(Body.Sun, observer, -1, noon, 1)?.date ?? null;
  const civilDawn = SearchAltitude(Body.Sun, observer, +1, dayStart, 1, -6)?.date ?? null;
  const civilDusk = SearchAltitude(Body.Sun, observer, -1, noon, 1, -6)?.date ?? null;
  const astronomicalDusk = SearchAltitude(Body.Sun, observer, -1, noon, 1.5, -18)?.date ?? null;
  const dawnSearchStart = astronomicalDusk ? new Date(astronomicalDusk.getTime() + 60_000) : dayStart;
  const astronomicalDawn = SearchAltitude(Body.Sun, observer, +1, dawnSearchStart, 1.5, -18)?.date ?? null;
  const moonrise = SearchRiseSet(Body.Moon, observer, +1, dayStart, 1)?.date ?? null;
  const moonset = SearchRiseSet(Body.Moon, observer, -1, dayStart, 1)?.date ?? null;
  const illumination = Illumination(Body.Moon, noon).phase_fraction * 100;
  const phaseAngle = MoonPhase(noon);

  let daylightHours = hoursBetween(sunrise, sunset);
  if (!sunrise || !sunset) daylightHours = bodyAltitude(Body.Sun, noon, observer) >= 0 ? 24 : 0;

  let darkStart = astronomicalDusk;
  let darkEnd = astronomicalDawn;
  if (!darkStart || !darkEnd || darkEnd <= darkStart) {
    const midnight = new Date(dayStart);
    midnight.setDate(midnight.getDate() + 1);
    if (bodyAltitude(Body.Sun, midnight, observer) <= -18) {
      darkStart = noon;
      darkEnd = nextNoon;
    }
  }

  const astronomicalDarkHours = hoursBetween(darkStart, darkEnd);
  let moonlessSamples = 0;
  if (darkStart && darkEnd) {
    for (let time = darkStart.getTime(); time < darkEnd.getTime(); time += 30 * 60_000) {
      if (bodyAltitude(Body.Moon, new Date(time), observer) < 0) moonlessSamples += 1;
    }
  }
  const moonlessDarkHours = Math.min(astronomicalDarkHours, moonlessSamples * 0.5);

  return {
    date: dayStart,
    sunrise,
    sunset,
    civilDawn,
    civilDusk,
    astronomicalDusk: darkStart,
    astronomicalDawn: darkEnd,
    moonrise,
    moonset,
    moonPhaseAngle: phaseAngle,
    moonPhase: phaseName(phaseAngle),
    moonIllumination: illumination,
    daylightHours,
    astronomicalDarkHours,
    moonlessDarkHours,
    darkSkyRating: rateNight(astronomicalDarkHours, moonlessDarkHours, illumination),
  };
}

export function buildMonthAlmanac(month: Date, latitude: number, longitude: number) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const count = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => buildAlmanacDay(new Date(year, monthIndex, index + 1), latitude, longitude));
}

export function monthMoonPhases(month: Date): MoonPhaseEvent[] {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const phases: Array<{ angle: number; name: MoonPhaseEvent["name"] }> = [
    { angle: 0, name: "New moon" },
    { angle: 90, name: "First quarter" },
    { angle: 180, name: "Full moon" },
    { angle: 270, name: "Last quarter" },
  ];
  return phases
    .flatMap(({ angle, name }) => {
      const event = SearchMoonPhase(angle, start, 35)?.date;
      return event ? [{ angle, name, date: event }] : [];
    })
    .filter((event) => event.date >= start && event.date < end)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
