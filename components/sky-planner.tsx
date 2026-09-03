"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Cloud, CloudRain, Clock3, Compass, Droplets, LocateFixed, MapPin, Moon, RefreshCw, ShieldCheck, Sparkles, SunMoon, Wind } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SkyMap } from "@/components/sky-map";
import {
  buildNightSummary,
  buildSkySnapshot,
  compassDirection,
  milkyWayCore,
} from "@/lib/sky";
import { fetchFieldConditions, type FieldConditions } from "@/lib/weather";

function toLocalInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatTime(date: Date | null) {
  return date
    ? new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(date)
    : "—";
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function altitudeLabel(altitude: number) {
  if (altitude >= 60) return "high overhead";
  if (altitude >= 30) return "well above the horizon";
  if (altitude >= 10) return "low in the sky";
  if (altitude >= 0) return "just above the horizon";
  return "below the horizon";
}

export function SkyPlanner() {
  const [dateTime, setDateTime] = useState("");
  const [latitude, setLatitude] = useState(38.9072);
  const [longitude, setLongitude] = useState(-77.0369);
  const [locationName, setLocationName] = useState("Washington, DC");
  const [locationStatus, setLocationStatus] = useState<"idle" | "requesting" | "ready" | "error">("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const [selectedId, setSelectedId] = useState("milky-way-core");
  const [weather, setWeather] = useState<{
    key: string;
    status: "idle" | "loading" | "ready" | "error";
    message: string;
    conditions: FieldConditions | null;
  }>({ key: "", status: "idle", message: "", conditions: null });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDateTime(toLocalInput(new Date())));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const selectedDate = useMemo(() => dateTime ? new Date(dateTime) : null, [dateTime]);
  const snapshot = useMemo(
    () => selectedDate ? buildSkySnapshot(selectedDate, latitude, longitude) : null,
    [selectedDate, latitude, longitude],
  );
  const night = useMemo(
    () => selectedDate ? buildNightSummary(selectedDate, latitude, longitude) : null,
    [selectedDate, latitude, longitude],
  );
  const selectedTarget = snapshot?.targets.find((target) => target.id === selectedId) ?? snapshot?.targets[0];
  const visibleTargets = useMemo(
    () => snapshot?.targets.filter((target) => target.altitude >= 0).sort((a, b) => b.altitude - a.altitude).slice(0, 8) ?? [],
    [snapshot],
  );

  const minutes = selectedDate ? selectedDate.getHours() * 60 + selectedDate.getMinutes() : 0;
  const currentWeatherKey = `${dateTime}|${latitude.toFixed(4)}|${longitude.toFixed(4)}`;
  const activeWeather = weather.key === currentWeatherKey
    ? weather
    : { key: currentWeatherKey, status: "idle" as const, message: "", conditions: null };

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage("This browser does not provide location access. Enter coordinates instead.");
      return;
    }
    setLocationStatus("requesting");
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(4)));
        setLongitude(Number(position.coords.longitude.toFixed(4)));
        setLocationName("Current location");
        setLocationStatus("ready");
        setLocationMessage("Location applied. Coordinates remain in this browser.");
      },
      (error) => {
        setLocationStatus("error");
        setLocationMessage(error.code === 1
          ? "Location permission was not granted. You can still enter coordinates manually."
          : "Your location could not be determined. Try again or enter coordinates manually.");
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 600_000 },
    );
  }

  function updateMinutes(value: number) {
    if (!selectedDate) return;
    const next = new Date(selectedDate);
    next.setHours(Math.floor(value / 60), value % 60, 0, 0);
    setDateTime(toLocalInput(next));
  }

  async function checkFieldConditions() {
    if (!selectedDate) return;
    const requestKey = currentWeatherKey;
    setWeather({ key: requestKey, status: "loading", message: "", conditions: null });
    try {
      const result = await fetchFieldConditions(selectedDate, latitude, longitude);
      setWeather((current) => current.key === requestKey
        ? { key: requestKey, status: "ready", message: "", conditions: result }
        : current);
    } catch (error) {
      setWeather((current) => current.key === requestKey
        ? { key: requestKey, status: "error", message: error instanceof Error ? error.message : "The forecast could not be loaded.", conditions: null }
        : current);
    }
  }

  return (
    <main>
      <SiteHeader active="planner" />
      <section className="planner-shell">
        <div className="planner-intro">
          <div>
            <p className="eyebrow"><Sparkles size={14} /> Location-aware night planning</p>
            <h1>Know where the sky<br /><em>will open up.</em></h1>
          </div>
          <p>Find the Milky Way core, bright stars, astronomical darkness, and Moon conditions for your location and any date or time.</p>
        </div>

        <section className="planner-controls" aria-label="Sky planner settings">
          <div className="location-control">
            <div className="control-heading"><MapPin size={18} /><div><span>Observer location</span><b>{locationName}</b></div></div>
            <button className="location-button" onClick={requestLocation} disabled={locationStatus === "requesting"}>
              <LocateFixed size={17} /> {locationStatus === "requesting" ? "Finding location…" : "Use my location"}
            </button>
            <div className="coordinate-fields">
              <label>Latitude<input type="number" min="-90" max="90" step="0.0001" value={latitude}
                onChange={(event) => { setLatitude(Number(event.target.value)); setLocationName("Custom coordinates"); }} /></label>
              <label>Longitude<input type="number" min="-180" max="180" step="0.0001" value={longitude}
                onChange={(event) => { setLongitude(Number(event.target.value)); setLocationName("Custom coordinates"); }} /></label>
            </div>
            {locationMessage && <p className={locationStatus === "error" ? "control-message error" : "control-message"}>{locationMessage}</p>}
            <p className="privacy-note"><ShieldCheck size={14} /> Sky positions stay on-device. A weather check sends coordinates rounded to 0.01° to Open-Meteo only after you tap the button.</p>
          </div>

          <div className="time-control">
            <div className="control-heading"><CalendarClock size={18} /><div><span>Date and time</span><b>{selectedDate ? formatDateTime(selectedDate) : "Loading local time…"}</b></div></div>
            <div className="date-input-row">
              <input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} aria-label="Observation date and time" />
              <button onClick={() => setDateTime(toLocalInput(new Date()))}>Now</button>
            </div>
            <label className="time-slider">
              <span><b>Time of day</b><output>{selectedDate ? formatTime(selectedDate) : "—"}</output></span>
              <input type="range" min="0" max="1435" step="5" value={minutes} onChange={(event) => updateMinutes(Number(event.target.value))} />
              <small><span>12 AM</span><span>6 AM</span><span>Noon</span><span>6 PM</span><span>Midnight</span></small>
            </label>
            <p className="timezone-note"><Clock3 size={14} /> Times are shown in your device’s timezone.</p>
          </div>
        </section>

        <section className="field-conditions" aria-live="polite">
          <div className="conditions-heading">
            <div><Cloud size={20} /><span><small>Optional live forecast</small><b>Field conditions</b></span></div>
            <button onClick={checkFieldConditions} disabled={!selectedDate || activeWeather.status === "loading"}>
              <RefreshCw size={16} className={activeWeather.status === "loading" ? "spinning" : ""} />
              {activeWeather.status === "loading" ? "Checking…" : activeWeather.conditions ? "Refresh conditions" : "Check field conditions"}
            </button>
          </div>
          {activeWeather.status === "idle" && <p className="conditions-prompt">Cloud, rain, wind, and dew can close an otherwise perfect astronomical window. The forecast is loaded only when requested.</p>}
          {activeWeather.status === "error" && <p className="conditions-error">{activeWeather.message}</p>}
          {activeWeather.conditions && <>
            <div className="conditions-summary">
              <span className={`condition-badge ${activeWeather.conditions.overall.toLowerCase()}`}>{activeWeather.conditions.overall}</span>
              <p>Forecast nearest {formatDateTime(activeWeather.conditions.forecastTime)} · {activeWeather.conditions.latitude.toFixed(2)}°, {activeWeather.conditions.longitude.toFixed(2)}°</p>
            </div>
            <div className="weather-grid">
              <article className={activeWeather.conditions.cloudLevel}><Cloud size={19} /><span>Cloud cover</span><strong>{Math.round(activeWeather.conditions.cloudCover)}%</strong><small>{activeWeather.conditions.visibilityKm.toFixed(0)} km model visibility</small></article>
              <article className={activeWeather.conditions.precipitationLevel}><CloudRain size={19} /><span>Precipitation</span><strong>{Math.round(activeWeather.conditions.precipitationProbability)}%</strong><small>Probability during this hour</small></article>
              <article className={activeWeather.conditions.windLevel}><Wind size={19} /><span>Wind</span><strong>{Math.round(activeWeather.conditions.windSpeed)} km/h</strong><small>Gusts {Math.round(activeWeather.conditions.windGust)} km/h</small></article>
              <article className={activeWeather.conditions.dewLevel}><Droplets size={19} /><span>Dew margin</span><strong>{activeWeather.conditions.dewMargin.toFixed(1)}°C</strong><small>{Math.round(activeWeather.conditions.humidity)}% humidity · {activeWeather.conditions.temperature.toFixed(1)}°C air</small></article>
            </div>
            <p className="forecast-note"><ShieldCheck size={14} /> Green is favorable, amber needs preparation, and red can compromise a session. Forecasts are guidance—not a safety service.</p>
          </>}
        </section>

        {snapshot && selectedDate && night && selectedTarget && <div className="planner-grid">
          <section className="sky-card">
            <div className="card-title-row">
              <div><p>Above your horizon</p><h2>Sky compass</h2></div>
              <span>{snapshot.light}</span>
            </div>
            <SkyMap
              targets={snapshot.targets}
              plane={snapshot.plane}
              moon={snapshot.moon}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </section>

          <aside className="planner-results">
            <section className="target-card">
              <div className="result-topline"><span>Selected target</span><Compass size={18} /></div>
              <h2>{selectedTarget.name}</h2>
              <div className="direction-readout">
                <div><strong>{Math.round(selectedTarget.azimuth)}°</strong><span>{compassDirection(selectedTarget.azimuth)} direction</span></div>
                <div><strong>{Math.round(selectedTarget.altitude)}°</strong><span>{altitudeLabel(selectedTarget.altitude)}</span></div>
              </div>
              <Link href={`/?declination=${selectedTarget.dec.toFixed(2)}`}>
                Use in exposure calculator <ArrowRight size={16} />
              </Link>
            </section>

            <section className="conditions-grid">
              <article><SunMoon size={18} /><span>Darkness</span><b>{snapshot.light}</b><small>{formatTime(night.dusk)} dusk · {formatTime(night.dawn)} dawn</small></article>
              <article><Moon size={18} /><span>Moon</span><b>{Math.round(snapshot.moonIllumination)}% · {snapshot.moonPhase}</b><small>{snapshot.moon.altitude >= 0 ? `${Math.round(snapshot.moon.altitude)}° high, ${compassDirection(snapshot.moon.azimuth)}` : "Below the horizon now"}</small></article>
            </section>

            <section className="night-window-card">
              <div><span>Milky Way core window</span><Sparkles size={17} /></div>
              {night.coreVisibleFrom && night.coreVisibleUntil
                ? <><strong>{formatTime(night.coreVisibleFrom)}–{formatTime(night.coreVisibleUntil)}</strong><p>Core above 10° during astronomical darkness.</p></>
                : <><strong>No dark visibility</strong><p>The core does not rise above 10° during astronomical darkness on this night.</p></>}
              {night.corePeak && <small>Nightly high point: {Math.round(night.corePeak.altitude)}° at {formatTime(night.corePeak.date)}, facing {compassDirection(night.corePeak.azimuth)}</small>}
            </section>

            <section className="target-list-card">
              <div className="card-title-row"><div><p>Tap to inspect</p><h3>Bright targets up now</h3></div></div>
              <div className="target-buttons">
                {visibleTargets.map((target) => <button key={target.id} className={selectedId === target.id ? "active" : ""} onClick={() => setSelectedId(target.id)}>
                  <span>{target.name}</span><small>{Math.round(target.altitude)}° · {compassDirection(target.azimuth)}</small>
                </button>)}
              </div>
            </section>
          </aside>
        </div>}
      </section>

      <footer>
        <p>Positions are calculated locally with Astronomy Engine. Bright-star coordinates use a compact J2000 naked-eye catalogue; this is a photographic planner, not a navigation instrument.</p>
        <p>Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. Forecasts are model estimates; local cloud, fog, and wind can differ.</p>
      </footer>
    </main>
  );
}
