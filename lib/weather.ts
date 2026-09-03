export type ConditionLevel = "good" | "watch" | "poor";

export type FieldConditions = {
  forecastTime: Date;
  latitude: number;
  longitude: number;
  temperature: number;
  dewPoint: number;
  dewMargin: number;
  humidity: number;
  cloudCover: number;
  precipitationProbability: number;
  windSpeed: number;
  windGust: number;
  visibilityKm: number;
  cloudLevel: ConditionLevel;
  precipitationLevel: ConditionLevel;
  windLevel: ConditionLevel;
  dewLevel: ConditionLevel;
  overall: "Promising" | "Mixed" | "Poor";
};

type HourlyForecast = {
  time: string[];
  temperature_2m: number[];
  dew_point_2m: number[];
  relative_humidity_2m: number[];
  cloud_cover: number[];
  precipitation_probability: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  visibility: number[];
};

function level(value: number, goodLimit: number, watchLimit: number): ConditionLevel {
  if (value <= goodLimit) return "good";
  if (value <= watchLimit) return "watch";
  return "poor";
}

export function assessFieldConditions(values: {
  cloudCover: number;
  precipitationProbability: number;
  windSpeed: number;
  windGust: number;
  dewMargin: number;
}) {
  const cloudLevel = level(values.cloudCover, 20, 50);
  const precipitationLevel = level(values.precipitationProbability, 10, 30);
  const windLevel = values.windSpeed <= 15 && values.windGust <= 25
    ? "good"
    : values.windSpeed <= 25 && values.windGust <= 40 ? "watch" : "poor";
  const dewLevel: ConditionLevel = values.dewMargin >= 4 ? "good" : values.dewMargin >= 2 ? "watch" : "poor";
  const levels = [cloudLevel, precipitationLevel, windLevel, dewLevel];
  const poorCount = levels.filter((item) => item === "poor").length;
  const watchCount = levels.filter((item) => item === "watch").length;
  const overall = poorCount >= 2 || values.cloudCover >= 80 || values.precipitationProbability >= 60
    ? "Poor"
    : poorCount >= 1 || watchCount >= 2 ? "Mixed" : "Promising";
  return { cloudLevel, precipitationLevel, windLevel, dewLevel, overall } as const;
}

function finiteAt(values: number[] | undefined, index: number, label: string) {
  const value = values?.[index];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Forecast did not include ${label}.`);
  return value;
}

export async function fetchFieldConditions(date: Date, latitude: number, longitude: number): Promise<FieldConditions> {
  const roundedLatitude = Number(latitude.toFixed(2));
  const roundedLongitude = Number(longitude.toFixed(2));
  const now = Date.now();
  if (date.getTime() < now - 36 * 60 * 60_000 || date.getTime() > now + 16 * 24 * 60 * 60_000) {
    throw new Error("Weather forecasts are available from yesterday through the next 16 days.");
  }

  const params = new URLSearchParams({
    latitude: String(roundedLatitude),
    longitude: String(roundedLongitude),
    hourly: [
      "temperature_2m",
      "dew_point_2m",
      "relative_humidity_2m",
      "cloud_cover",
      "precipitation_probability",
      "wind_speed_10m",
      "wind_gusts_10m",
      "visibility",
    ].join(","),
    past_days: "1",
    forecast_days: "16",
    timezone: "UTC",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) throw new Error("The weather service is unavailable right now. Try again shortly.");
  const payload = await response.json() as { hourly?: HourlyForecast };
  const hourly = payload.hourly;
  if (!hourly?.time?.length) throw new Error("No hourly forecast was returned for this location.");

  const target = date.getTime();
  let index = 0;
  let smallestDifference = Number.POSITIVE_INFINITY;
  hourly.time.forEach((time, candidate) => {
    const difference = Math.abs(new Date(`${time}Z`).getTime() - target);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      index = candidate;
    }
  });
  if (smallestDifference > 90 * 60_000) throw new Error("No nearby hourly forecast is available for that time.");

  const temperature = finiteAt(hourly.temperature_2m, index, "temperature");
  const dewPoint = finiteAt(hourly.dew_point_2m, index, "dew point");
  const cloudCover = finiteAt(hourly.cloud_cover, index, "cloud cover");
  const precipitationProbability = finiteAt(hourly.precipitation_probability, index, "precipitation probability");
  const windSpeed = finiteAt(hourly.wind_speed_10m, index, "wind speed");
  const windGust = finiteAt(hourly.wind_gusts_10m, index, "wind gusts");
  const dewMargin = temperature - dewPoint;
  const assessment = assessFieldConditions({ cloudCover, precipitationProbability, windSpeed, windGust, dewMargin });

  return {
    forecastTime: new Date(`${hourly.time[index]}Z`),
    latitude: roundedLatitude,
    longitude: roundedLongitude,
    temperature,
    dewPoint,
    dewMargin,
    humidity: finiteAt(hourly.relative_humidity_2m, index, "relative humidity"),
    cloudCover,
    precipitationProbability,
    windSpeed,
    windGust,
    visibilityKm: finiteAt(hourly.visibility, index, "visibility") / 1_000,
    ...assessment,
  };
}
