"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, LocateFixed, MapPin, Moon, ShieldCheck, Sparkles, Sun, Sunrise, Sunset, Telescope } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { buildMonthAlmanac, monthMoonPhases, type AlmanacDay } from "@/lib/almanac";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatTime(date: Date | null) {
  return date ? new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(date) : "No event";
}

function formatHours(hours: number) {
  const totalMinutes = Math.round(hours * 60);
  return `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}m`;
}

function phaseSymbol(angle: number) {
  const phase = Math.round(angle / 45) % 8;
  return ["○", "◔", "◐", "◕", "●", "◕", "◑", "◔"][phase];
}

function ratingClass(rating: AlmanacDay["darkSkyRating"]) {
  return rating.toLowerCase().replaceAll(" ", "-");
}

function skyPlannerHref(day: AlmanacDay, latitude: number, longitude: number, location: string) {
  const time = day.astronomicalDusk ?? new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 22);
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    date: `${dateKey(time)}T${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`,
    location,
  });
  return `/sky-planner/?${params.toString()}`;
}

export function SunMoonCalendar({ initialDate }: { initialDate: string }) {
  const initialDay = useMemo(() => parseDateKey(initialDate), [initialDate]);
  const [today, setToday] = useState(initialDay);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(dateKey(today));
  const [view, setView] = useState<"moon" | "sun">("moon");
  const [latitude, setLatitude] = useState(38.9072);
  const [longitude, setLongitude] = useState(-77.0369);
  const [locationName, setLocationName] = useState("Washington, DC");
  const [locationMessage, setLocationMessage] = useState("");
  const deferredLatitude = useDeferredValue(latitude);
  const deferredLongitude = useDeferredValue(longitude);

  useEffect(() => {
    const current = new Date();
    if (dateKey(current) === initialDate) return;
    const frame = window.requestAnimationFrame(() => {
      setToday(current);
      setMonth(new Date(current.getFullYear(), current.getMonth(), 1));
      setSelectedKey(dateKey(current));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialDate]);

  useEffect(() => {
    const saved = window.localStorage.getItem("astro-npf-trip-location");
    if (!saved) return;
    try {
      const value = JSON.parse(saved) as { latitude: number; longitude: number; locationName: string };
      if (Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) {
        const frame = window.requestAnimationFrame(() => {
          setLatitude(value.latitude);
          setLongitude(value.longitude);
          setLocationName(value.locationName || "Saved location");
        });
        return () => window.cancelAnimationFrame(frame);
      }
    } catch { /* Ignore stale browser data. */ }
  }, []);

  const days = useMemo(() => buildMonthAlmanac(month, deferredLatitude, deferredLongitude), [month, deferredLatitude, deferredLongitude]);
  const phaseEvents = useMemo(() => monthMoonPhases(month), [month]);
  const selectedDay = days.find((day) => dateKey(day.date) === selectedKey) ?? days[0];
  const bestNights = useMemo(() => [...days]
    .filter((day) => day.astronomicalDarkHours > 0)
    .sort((a, b) => (b.moonlessDarkHours - b.moonIllumination / 50) - (a.moonlessDarkHours - a.moonIllumination / 50))
    .slice(0, 3), [days]);
  const leadingBlanks = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const monthLabel = new Intl.DateTimeFormat([], { month: "long", year: "numeric" }).format(month);
  const selectedLabel = new Intl.DateTimeFormat([], { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(selectedDay.date);

  function changeMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    const isCurrentMonth = next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth();
    setSelectedKey(dateKey(isCurrentMonth ? today : next));
  }

  function returnToToday() {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedKey(dateKey(today));
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Location is unavailable in this browser. Enter coordinates instead.");
      return;
    }
    setLocationMessage("Requesting location permission…");
    navigator.geolocation.getCurrentPosition((position) => {
      const nextLatitude = Number(position.coords.latitude.toFixed(4));
      const nextLongitude = Number(position.coords.longitude.toFixed(4));
      setLatitude(nextLatitude);
      setLongitude(nextLongitude);
      setLocationName("Current location");
      setLocationMessage("Location applied and shared with Trip Planner on this device.");
      window.localStorage.setItem("astro-npf-trip-location", JSON.stringify({ latitude: nextLatitude, longitude: nextLongitude, locationName: "Current location" }));
    }, (error) => setLocationMessage(error.code === 1
      ? "Location permission was not granted. Enter coordinates instead."
      : "Location could not be determined. Try again or enter coordinates."),
    { enableHighAccuracy: false, timeout: 12_000, maximumAge: 600_000 });
  }

  return <main>
    <SiteHeader active="calendar" />
    <section className="almanac-shell">
      <div className="almanac-hero">
        <div><p className="eyebrow"><CalendarDays size={14} /> Sun & Moon calendar</p><h1>Read the month.<br /><em>Choose the night.</em></h1></div>
        <p>Compare Moon light, darkness, daylight, and twilight at your location—then open any date in the sky planner.</p>
      </div>

      <section className="almanac-toolbar" aria-label="Calendar controls">
        <div className="almanac-month-control">
          <button aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
          <div><small>Selected month</small><strong>{monthLabel}</strong></div>
          <button aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
          <button className="almanac-today" onClick={returnToToday}>Today</button>
        </div>
        <div className="almanac-location-control">
          <div><MapPin size={16} /><span><small>Observing location</small><strong>{locationName}</strong></span></div>
          <label>Lat<input type="number" min="-90" max="90" step="0.0001" value={latitude} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setLatitude(Math.max(-90, Math.min(90, value))); setLocationName("Custom coordinates"); }} /></label>
          <label>Lon<input type="number" min="-180" max="180" step="0.0001" value={longitude} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) setLongitude(Math.max(-180, Math.min(180, value))); setLocationName("Custom coordinates"); }} /></label>
          <button onClick={requestLocation}><LocateFixed size={16} /> Use my location</button>
        </div>
        {locationMessage && <p className="almanac-location-message">{locationMessage}</p>}
      </section>

      <div className="almanac-view-tabs" role="group" aria-label="Calendar view">
        <button className={view === "moon" ? "active" : ""} aria-pressed={view === "moon"} onClick={() => setView("moon")}><Moon size={16} /><span><b>Moon & darkness</b><small>Illumination and moonless hours</small></span></button>
        <button className={view === "sun" ? "active" : ""} aria-pressed={view === "sun"} onClick={() => setView("sun")}><Sun size={16} /><span><b>Sun & twilight</b><small>Daylight, sunrise, and sunset</small></span></button>
      </div>

      <section className={`almanac-calendar ${view}`} aria-label={`${monthLabel} ${view} calendar`}>
        <div className="almanac-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="almanac-days">
          {Array.from({ length: leadingBlanks }, (_, index) => <span className="almanac-blank" key={`blank-${index}`} aria-hidden="true" />)}
          {days.map((day) => {
            const key = dateKey(day.date);
            const isToday = key === dateKey(today);
            const isSelected = key === selectedKey;
            return <button key={key} className={`${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`} aria-pressed={isSelected} onClick={() => setSelectedKey(key)}>
              <span className="almanac-day-number">{day.date.getDate()}{isToday && <em>Today</em>}</span>
              {view === "moon" ? <>
                <span className={`almanac-phase phase-${Math.round(day.moonPhaseAngle / 45) % 8}`} aria-hidden="true">{phaseSymbol(day.moonPhaseAngle)}</span>
                <strong>{Math.round(day.moonIllumination)}% Moon</strong>
                <small>{day.moonPhase}</small>
                <span className={`almanac-rating ${ratingClass(day.darkSkyRating)}`}>{day.moonlessDarkHours.toFixed(1)}h moonless</span>
              </> : <>
                <Sun className="almanac-sun-icon" size={23} aria-hidden="true" />
                <strong>{formatHours(day.daylightHours)}</strong>
                <small>Daylight</small>
                <span className="almanac-sun-times">↑ {formatTime(day.sunrise)}<br />↓ {formatTime(day.sunset)}</span>
              </>}
            </button>;
          })}
        </div>
      </section>

      <section className="almanac-detail" aria-live="polite">
        <div className="almanac-detail-heading">
          <div><p className="eyebrow"><Sparkles size={14} /> Selected night</p><h2>{selectedLabel}</h2></div>
          <span className={`almanac-quality ${ratingClass(selectedDay.darkSkyRating)}`}><small>Astrophoto outlook</small><b>{selectedDay.darkSkyRating}</b></span>
        </div>
        <div className="almanac-detail-grid">
          <article>
            <div className="almanac-card-title"><Sun size={18} /><span><small>Sun calendar</small><h3>Light & twilight</h3></span></div>
            <dl>
              <div><dt><Sunrise size={14} /> Sunrise</dt><dd>{formatTime(selectedDay.sunrise)}</dd></div>
              <div><dt><Sunset size={14} /> Sunset</dt><dd>{formatTime(selectedDay.sunset)}</dd></div>
              <div><dt>Civil dawn</dt><dd>{formatTime(selectedDay.civilDawn)}</dd></div>
              <div><dt>Civil dusk</dt><dd>{formatTime(selectedDay.civilDusk)}</dd></div>
              <div><dt>Daylight</dt><dd>{formatHours(selectedDay.daylightHours)}</dd></div>
              <div><dt>Astronomical dark</dt><dd>{formatHours(selectedDay.astronomicalDarkHours)}</dd></div>
            </dl>
          </article>
          <article>
            <div className="almanac-card-title"><Moon size={18} /><span><small>Moon calendar</small><h3>{selectedDay.moonPhase}</h3></span></div>
            <dl>
              <div><dt>Illumination</dt><dd>{Math.round(selectedDay.moonIllumination)}%</dd></div>
              <div><dt>Moonrise</dt><dd>{formatTime(selectedDay.moonrise)}</dd></div>
              <div><dt>Moonset</dt><dd>{formatTime(selectedDay.moonset)}</dd></div>
              <div><dt>Dark begins</dt><dd>{formatTime(selectedDay.astronomicalDusk)}</dd></div>
              <div><dt>Dark ends</dt><dd>{formatTime(selectedDay.astronomicalDawn)}</dd></div>
              <div><dt>Moonless dark</dt><dd>{formatHours(selectedDay.moonlessDarkHours)}</dd></div>
            </dl>
          </article>
        </div>
        <Link className="almanac-planner-link" href={skyPlannerHref(selectedDay, deferredLatitude, deferredLongitude, locationName)}><Telescope size={16} /> Open this night in Sky Planner <ArrowRight size={15} /></Link>
      </section>

      <section className="almanac-month-notes">
        <article><h2>Moon phases</h2>{phaseEvents.map((event) => <div key={event.name}><span>{phaseSymbol(event.angle)}</span><b>{event.name}</b><time>{new Intl.DateTimeFormat([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(event.date)}</time></div>)}</article>
        <article><h2>Darkest nights</h2>{bestNights.map((day, index) => <button key={dateKey(day.date)} onClick={() => setSelectedKey(dateKey(day.date))}><span>0{index + 1}</span><b>{new Intl.DateTimeFormat([], { month: "short", day: "numeric" }).format(day.date)}</b><small>{day.moonlessDarkHours.toFixed(1)}h moonless · {Math.round(day.moonIllumination)}% Moon</small></button>)}</article>
      </section>

      <section className="almanac-note"><ShieldCheck size={18} /><p><b>Times use this device’s local clock.</b> Coordinates stay in the browser and are saved only after you approve location access. Terrain and buildings can shift apparent rise and set times near the horizon.</p></section>
    </section>
    <footer><p>Sun, Moon, twilight, and phase calculations run locally with Astronomy Engine.</p><p>Astronomical darkness begins when the Sun reaches 18° below the horizon. Moonless hours are sampled in 30-minute intervals.</p></footer>
  </main>;
}
