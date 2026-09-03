"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronRight, Compass, LocateFixed, MapPinned, Moon, Route, ShieldCheck, Sparkles, Telescope } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { findScoutingPlaces, rankNights, tripTargets, type NightPlan, type ScoutingPlace } from "@/lib/trip";

function dateInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatTime(date: Date | null) {
  return date ? new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(date) : "Not visible";
}

function miles(kilometers: number) {
  return Math.round(kilometers * 0.621371);
}

function plannerHref(place: ScoutingPlace, plan: NightPlan) {
  const time = plan.metrics.find((metric) => metric.bestTime)?.bestTime ?? plan.date;
  const params = new URLSearchParams({
    latitude: place.latitude.toFixed(4),
    longitude: place.longitude.toFixed(4),
    date: `${dateInput(time)}T${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`,
    location: place.name,
  });
  return `/sky-planner/?${params.toString()}`;
}

export function TripPlanner() {
  const today = useMemo(() => new Date(), []);
  const twoWeeks = useMemo(() => new Date(today.getTime() + 14 * 86_400_000), [today]);
  const [latitude, setLatitude] = useState(38.9072);
  const [longitude, setLongitude] = useState(-77.0369);
  const [locationName, setLocationName] = useState("Washington, DC");
  const [locationMessage, setLocationMessage] = useState("");
  const [radiusKm, setRadiusKm] = useState(250);
  const [mode, setMode] = useState<"flexible" | "fixed">("flexible");
  const [startDate, setStartDate] = useState(dateInput(today));
  const [endDate, setEndDate] = useState(dateInput(twoWeeks));
  const [selectedIds, setSelectedIds] = useState(["milky-way-core"]);
  const [plans, setPlans] = useState<NightPlan[]>([]);
  const [places, setPlaces] = useState<ScoutingPlace[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

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

  function selectTarget(id: string) {
    setSelectedIds((current) => current.includes(id)
      ? current.length === 1 ? current : current.filter((value) => value !== id)
      : [...current, id]);
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("This browser does not provide location access. Enter coordinates instead.");
      return;
    }
    setLocationMessage("Requesting location permission…");
    navigator.geolocation.getCurrentPosition((position) => {
      const nextLatitude = Number(position.coords.latitude.toFixed(4));
      const nextLongitude = Number(position.coords.longitude.toFixed(4));
      setLatitude(nextLatitude);
      setLongitude(nextLongitude);
      setLocationName("Current location");
      setLocationMessage("Location applied and saved in this browser.");
      window.localStorage.setItem("astro-npf-trip-location", JSON.stringify({ latitude: nextLatitude, longitude: nextLongitude, locationName: "Current location" }));
    }, (error) => setLocationMessage(error.code === 1
      ? "Location permission was not granted. Enter coordinates instead."
      : "Location could not be determined. Try again or enter coordinates."),
    { enableHighAccuracy: false, timeout: 12_000, maximumAge: 600_000 });
  }

  async function buildTrip() {
    const targets = tripTargets.filter((target) => selectedIds.includes(target.id));
    const start = mode === "flexible" ? new Date() : new Date(`${startDate}T12:00`);
    const end = mode === "flexible"
      ? new Date(start.getTime() + 365 * 86_400_000)
      : new Date(`${endDate}T12:00`);
    if (!targets.length || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) {
      setStatus("error");
      setMessage("Choose at least one target and a valid date range.");
      return;
    }
    if (mode === "fixed" && (end.getTime() - start.getTime()) / 86_400_000 > 45) {
      setStatus("error");
      setMessage("Keep a fixed search to 45 days or fewer, or use flexible dates.");
      return;
    }
    setStatus("loading");
    setMessage("");
    setPlans(rankNights(start, end, mode === "flexible" ? 2 : 1, latitude, longitude, targets));
    try {
      const nearby = await findScoutingPlaces(latitude, longitude, radiusKm);
      setPlaces(nearby);
      setStatus("ready");
      if (!nearby.length) setMessage("No named scouting areas were returned in this radius. Try a wider search or use the date results from your own spot.");
    } catch (error) {
      setPlaces([]);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Nearby places could not be loaded.");
    }
  }

  const bestPlan = plans[0];

  return <main>
    <SiteHeader active="trip" />
    <section className="trip-shell">
      <div className="trip-hero">
        <div>
          <p className="eyebrow"><Route size={14} /> Astrophotography trip planner</p>
          <h1>Chase the shot,<br /><em>not the guesswork.</em></h1>
        </div>
        <p>Pick what you want to photograph. We’ll rank promising nights and find nearby outdoor areas worth scouting.</p>
      </div>

      <section className="trip-builder" aria-label="Trip preferences">
        <div className="trip-step">
          <span className="trip-step-number">01</span>
          <div className="trip-step-heading"><Telescope size={20} /><div><small>Choose one or more</small><h2>What do you want to shoot?</h2></div></div>
          <div className="trip-targets">
            {tripTargets.map((target) => <button key={target.id} aria-pressed={selectedIds.includes(target.id)} onClick={() => selectTarget(target.id)}>
              <span className="target-check">{selectedIds.includes(target.id) && <Check size={13} />}</span>
              <span><b>{target.shortName}</b><small>{target.description}</small><em>{target.season}</em></span>
            </button>)}
          </div>
        </div>

        <div className="trip-step trip-location-step">
          <span className="trip-step-number">02</span>
          <div className="trip-step-heading"><MapPinned size={20} /><div><small>Starting point and range</small><h2>How far will you travel?</h2></div></div>
          <div className="trip-location-row">
            <div>
              <label>Latitude<input type="number" min="-90" max="90" step="0.0001" value={latitude} onChange={(event) => { setLatitude(Number(event.target.value)); setLocationName("Custom coordinates"); }} /></label>
              <label>Longitude<input type="number" min="-180" max="180" step="0.0001" value={longitude} onChange={(event) => { setLongitude(Number(event.target.value)); setLocationName("Custom coordinates"); }} /></label>
              <button className="trip-location-button" onClick={requestLocation}><LocateFixed size={16} /> Use my location</button>
            </div>
            <label className="radius-control"><span><b>Travel radius</b><output>{radiusKm} km · {miles(radiusKm)} mi</output></span><input type="range" min="10" max="1000" step="10" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} /><small>Straight-line search radius · driving distance may be longer</small></label>
          </div>
          <p className="trip-location-name"><Compass size={14} /> {locationName} · {latitude.toFixed(4)}°, {longitude.toFixed(4)}°</p>
          {locationMessage && <p className="trip-message">{locationMessage}</p>}
        </div>

        <div className="trip-step">
          <span className="trip-step-number">03</span>
          <div className="trip-step-heading"><CalendarDays size={20} /><div><small>Set a window or stay open</small><h2>When can you go?</h2></div></div>
          <div className="date-mode-tabs">
            <button className={mode === "flexible" ? "active" : ""} onClick={() => setMode("flexible")}><b>Flexible dates</b><small>Find the best nights in the next year</small></button>
            <button className={mode === "fixed" ? "active" : ""} onClick={() => setMode("fixed")}><b>I have dates</b><small>Rank nights in a window up to 45 days</small></button>
          </div>
          {mode === "fixed" && <div className="trip-date-fields">
            <label>Earliest night<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label>Latest night<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          </div>}
        </div>

        <div className="trip-action">
          <div><ShieldCheck size={16} /><p>Astronomy stays on-device. When you press the button, rounded coordinates are sent to OpenStreetMap’s public search service.</p></div>
          <button onClick={buildTrip} disabled={status === "loading"}><Sparkles size={17} /> {status === "loading" ? "Finding nearby areas…" : "Find dates & places"}</button>
        </div>
      </section>

      {plans.length > 0 && <section className="trip-results" aria-live="polite">
        <div className="trip-results-heading"><div><p className="eyebrow">Your short list</p><h2>Best nights from this location</h2></div><p>Ranked for altitude, astronomical darkness, and Moon interference. Weather is checked separately because reliable forecasts only extend days—not months—ahead.</p></div>
        <div className="night-plan-grid">
          {plans.slice(0, 6).map((plan, index) => <article key={plan.date.toISOString()} className={index === 0 ? "featured" : ""}>
            <div className="night-plan-top"><span>{index === 0 ? "Best match" : `Option ${index + 1}`}</span><b className={plan.rating.toLowerCase()}>{plan.rating} · {plan.score}</b></div>
            <h3>{formatDate(plan.date)}</h3>
            <div className="night-facts"><span><Sparkles size={14} /> {plan.darkHours.toFixed(1)} h astronomical dark</span><span><Moon size={14} /> {Math.round(plan.moonIllumination)}% Moon</span></div>
            <div className="night-target-metrics">{plan.metrics.map((metric) => <div key={metric.id}><span><b>{metric.name}</b><small>{metric.visibleHours.toFixed(1)} h above 20°</small></span><span><strong>{Math.round(metric.peakAltitude)}°</strong><small>best {formatTime(metric.bestTime)}</small></span></div>)}</div>
          </article>)}
        </div>
      </section>}

      {plans.length > 0 && <section className="place-results">
        <div className="trip-results-heading"><div><p className="eyebrow">Scouting candidates</p><h2>Outdoor areas within {radiusKm} km · {miles(radiusKm)} mi</h2></div><p>Long-range searches prioritize astronomy sites and major protected lands. These are map features—not verified dark sites. Confirm access, safety, horizon, parking, permits, and local light pollution before leaving.</p></div>
        {message && <p className={`trip-alert ${status === "error" ? "error" : ""}`}>{message}</p>}
        {places.length > 0 && bestPlan && <div className="place-grid">{places.map((place) => <article key={place.id}>
          <span className="place-category">{place.category}</span>
          <h3>{place.name}</h3>
          <p>{place.distanceKm.toFixed(1)} km · {miles(place.distanceKm)} mi {place.direction} · straight line</p>
          <div>
            <a href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=13/${place.latitude}/${place.longitude}`} target="_blank" rel="noreferrer">Open map</a>
            <Link href={plannerHref(place, bestPlan)}>Check sky & weather <ChevronRight size={14} /></Link>
          </div>
        </article>)}</div>}
      </section>}

      <section className="trip-caveat">
        <ShieldCheck size={19} /><div><b>Plan, then verify.</b><p>A strong score means the geometry is promising, not that the trip is guaranteed. Check forecast, smoke, road conditions, tides, closures, wildlife rules, and land access close to departure. Never rely on this tool for navigation or safety.</p></div>
      </section>
    </section>
    <footer>
      <p>Sky calculations run locally with Astronomy Engine. Target coordinates use J2000 catalogue positions from SIMBAD/CDS and established astronomical references.</p>
      <p>Nearby features © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. Place search uses the community Overpass API and may occasionally be unavailable.</p>
    </footer>
  </main>;
}
