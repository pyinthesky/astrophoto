"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronRight, Clock3, Compass, LocateFixed, MapPinned, Maximize2, Moon, Plus, Radar, Route, Search, ShieldCheck, Sparkles, Telescope, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { catalogTargetToTripTarget, findScoutingPlaces, rankNights, recommendCatalogueTargets, tripTargets, type NightPlan, type RecommendationFamily, type RecommendationScale, type ScoutingPlace, type TargetRecommendation, type TripTarget } from "@/lib/trip";
import { loadTargetCatalog, normalizeTargetSearch, targetSearchText, targetTypeLabels, type TargetTuple } from "@/lib/targets";

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

function recommendationName(target: TargetTuple) {
  const commonName = target[9].split(",")[0];
  const familiarAlias = target[8].split("|").find((alias) => /^M \d+$/.test(alias) || alias.startsWith("Caldwell "));
  return commonName || familiarAlias || target[0];
}

function recommendationCode(target: TargetTuple) {
  const familiarAlias = target[8].split("|").find((alias) => /^M \d+$/.test(alias) || alias.startsWith("Caldwell "));
  return familiarAlias ? `${familiarAlias} · ${target[0]}` : target[0];
}

function formatAngularSize(size: number | null) {
  if (size === null) return "Not listed";
  return size >= 60 ? `${(size / 60).toFixed(size >= 120 ? 1 : 2)}°` : `${size.toFixed(size >= 10 ? 0 : 1)}′`;
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
  const [catalogTargets, setCatalogTargets] = useState<TargetTuple[]>([]);
  const [customTargets, setCustomTargets] = useState<TripTarget[]>([]);
  const [targetQuery, setTargetQuery] = useState("");
  const [targetMessage, setTargetMessage] = useState("");
  const [catalogStatus, setCatalogStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [recommendationDate, setRecommendationDate] = useState(dateInput(today));
  const [recommendationFamily, setRecommendationFamily] = useState<RecommendationFamily>("all");
  const [recommendationScale, setRecommendationScale] = useState<RecommendationScale>("all");
  const [recommendations, setRecommendations] = useState<TargetRecommendation[]>([]);
  const [recommendationStatus, setRecommendationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [plans, setPlans] = useState<NightPlan[]>([]);
  const [places, setPlaces] = useState<ScoutingPlace[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const deferredTargetQuery = useDeferredValue(targetQuery);
  const catalogueRequest = useRef<Promise<TargetTuple[]> | null>(null);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("target")?.slice(0, 120);
    const rawRa = params.get("ra");
    const rawDec = params.get("dec");
    if (!name || rawRa === null || rawDec === null) return;
    const ra = Number(rawRa);
    const dec = Number(rawDec);
    if (!Number.isFinite(ra) || ra < 0 || ra > 24 || !Number.isFinite(dec) || dec < -90 || dec > 90) return;
    const rawMagnitude = params.get("magnitude");
    const magnitude = rawMagnitude && Number.isFinite(Number(rawMagnitude)) ? Number(rawMagnitude) : null;
    const tuple: TargetTuple = [
      name,
      params.get("type")?.slice(0, 12) || "Other",
      ra,
      dec,
      params.get("constellation")?.slice(0, 8) || "—",
      null,
      null,
      magnitude,
      "",
      params.get("common")?.slice(0, 120) || "",
    ];
    const frame = window.requestAnimationFrame(() => {
      setSelectedIds([]);
      setCustomTargets([catalogTargetToTripTarget(tuple)]);
      setTargetMessage(`${name} added from the target catalogue.`);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const matchingTargets = useMemo(() => {
    const needle = normalizeTargetSearch(deferredTargetQuery);
    if (needle.length < 2) return [];
    return catalogTargets
      .filter((target) => targetSearchText(target).includes(needle))
      .sort((a, b) => {
        const aName = normalizeTargetSearch(a[0]);
        const bName = normalizeTargetSearch(b[0]);
        const aRank = aName === needle ? 0 : aName.startsWith(needle) ? 1 : 2;
        const bRank = bName === needle ? 0 : bName.startsWith(needle) ? 1 : 2;
        return aRank - bRank;
      })
      .slice(0, 6);
  }, [catalogTargets, deferredTargetQuery]);

  async function ensureCatalogue() {
    if (catalogTargets.length > 0) return catalogTargets;
    if (!catalogueRequest.current) {
      setCatalogStatus("loading");
      catalogueRequest.current = loadTargetCatalog().then((payload) => payload.objects);
    }
    try {
      const objects = await catalogueRequest.current;
      setCatalogTargets(objects);
      setCatalogStatus("ready");
      return objects;
    } catch {
      catalogueRequest.current = null;
      setCatalogStatus("error");
      setTargetMessage("The target catalogue could not be loaded. Refresh and try again.");
      throw new Error("Catalogue unavailable");
    }
  }

  function loadCatalogue() {
    void ensureCatalogue().catch(() => undefined);
  }

  function clearRecommendations() {
    setRecommendations([]);
    setRecommendationStatus("idle");
    setRecommendationMessage("");
  }

  async function findRecommendations() {
    const date = new Date(`${recommendationDate}T12:00`);
    if (!Number.isFinite(date.getTime()) || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setRecommendationStatus("error");
      setRecommendationMessage("Enter a valid date and location first.");
      return;
    }
    setRecommendationStatus("loading");
    setRecommendationMessage("");
    try {
      const catalogue = await ensureCatalogue();
      const results = recommendCatalogueTargets(catalogue, date, latitude, longitude, recommendationFamily, recommendationScale);
      setRecommendations(results);
      setRecommendationStatus("ready");
      setRecommendationMessage(results.length === 0
        ? "No suitable objects were found during astronomical darkness. Try another date, target family, or framing scale."
        : `${results[0].darkHours.toFixed(1)} hours of astronomical darkness · Moon ${Math.round(results[0].moonIllumination)}% illuminated`);
    } catch {
      setRecommendations([]);
      setRecommendationStatus("error");
      setRecommendationMessage("Recommendations could not be calculated because the catalogue did not load.");
    }
  }

  function selectTarget(id: string) {
    if (selectedIds.includes(id)) {
      if (selectedIds.length + customTargets.length === 1) return;
      setSelectedIds((current) => current.filter((value) => value !== id));
      return;
    }
    if (selectedIds.length + customTargets.length >= 6) {
      setTargetMessage("Choose up to six targets per trip search.");
      return;
    }
    setSelectedIds((current) => [...current, id]);
  }

  function addCatalogueTarget(target: TargetTuple) {
    const converted = catalogTargetToTripTarget(target);
    if (customTargets.some((item) => item.id === converted.id)) {
      setTargetMessage(`${converted.shortName} is already selected.`);
      return;
    }
    if (selectedIds.length + customTargets.length >= 6) {
      setTargetMessage("Choose up to six targets per trip search.");
      return;
    }
    setCustomTargets((current) => [...current, converted]);
    setTargetQuery("");
    setTargetMessage(`${converted.shortName} added.`);
  }

  function removeCatalogueTarget(id: string) {
    if (selectedIds.length + customTargets.length === 1) return;
    setCustomTargets((current) => current.filter((target) => target.id !== id));
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
      clearRecommendations();
      window.localStorage.setItem("astro-npf-trip-location", JSON.stringify({ latitude: nextLatitude, longitude: nextLongitude, locationName: "Current location" }));
    }, (error) => setLocationMessage(error.code === 1
      ? "Location permission was not granted. Enter coordinates instead."
      : "Location could not be determined. Try again or enter coordinates."),
    { enableHighAccuracy: false, timeout: 12_000, maximumAge: 600_000 });
  }

  async function buildTrip() {
    const targets = [...tripTargets.filter((target) => selectedIds.includes(target.id)), ...customTargets];
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
      if (!nearby.length) setMessage(radiusKm > 250
        ? "No certified dark-sky destination was found in the catalogue within this radius. Try a wider search or use the date results from your own spot."
        : "No named scouting areas were returned in this radius. Try a wider search or use the date results from your own spot.");
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
          <div className="trip-catalog-picker">
            <div className="trip-catalog-heading"><div><Search size={16} /><span><b>Search the full catalogue</b><small>Add any Messier, Caldwell, NGC, or IC object</small></span></div><em>{selectedIds.length + customTargets.length}/6 selected</em></div>
            {customTargets.length > 0 && <div className="trip-custom-targets">{customTargets.map((target) => <span key={target.id}><span><b>{target.shortName}</b><small>{target.description}</small></span><button aria-label={`Remove ${target.shortName}`} onClick={() => removeCatalogueTarget(target.id)} disabled={selectedIds.length + customTargets.length === 1}><X size={13} /></button></span>)}</div>}
            <label className="trip-target-search"><Search size={15} /><span className="sr-only">Search catalogue targets</span><input value={targetQuery} onFocus={loadCatalogue} onChange={(event) => { setTargetQuery(event.target.value); loadCatalogue(); }} placeholder="Search M31, Horsehead Nebula, NGC 7000…" autoComplete="off" />{catalogStatus === "loading" && <small>Loading…</small>}</label>
            {targetQuery.length >= 2 && catalogStatus === "ready" && <div className="trip-target-matches">{matchingTargets.length > 0 ? matchingTargets.map((target) => <button key={`${target[0]}-${target[2]}-${target[3]}`} onClick={() => addCatalogueTarget(target)}><span><b>{target[9].split(",")[0] || target[0]}</b><small>{target[0]} · {targetTypeLabels[target[1]] ?? target[1]} · {target[4]}</small></span><Plus size={15} /></button>) : <p>No matching catalogue objects.</p>}</div>}
            {targetMessage && <p className="trip-target-message">{targetMessage}</p>}
          </div>
          <div className="trip-recommendations">
            <div className="trip-recommendation-heading"><div><Radar size={17} /><span><b>What’s good tonight?</b><small>Rank the catalogue for your location and gear</small></span></div><em>{locationName}</em></div>
            <div className="trip-recommendation-controls">
              <label>Night<input type="date" value={recommendationDate} onChange={(event) => { setRecommendationDate(event.target.value); clearRecommendations(); }} /></label>
              <label>Target type<select value={recommendationFamily} onChange={(event) => { setRecommendationFamily(event.target.value as RecommendationFamily); clearRecommendations(); }}><option value="all">All deep-sky objects</option><option value="galaxy">Galaxies</option><option value="nebula">Nebulae & remnants</option><option value="cluster">Star clusters</option><option value="planetary">Planetary nebulae</option></select></label>
              <label>Framing<select value={recommendationScale} onChange={(event) => { setRecommendationScale(event.target.value as RecommendationScale); clearRecommendations(); }}><option value="all">Any focal length</option><option value="wide">Wide field · 14–50 mm</option><option value="telephoto">Telephoto · 70–300 mm</option><option value="telescope">Telescope · small targets</option></select></label>
              <button onClick={findRecommendations} disabled={recommendationStatus === "loading"}><Sparkles size={15} /> {recommendationStatus === "loading" ? "Ranking…" : "Find targets"}</button>
            </div>
            {recommendationMessage && <p className={`trip-recommendation-message ${recommendationStatus === "error" ? "error" : ""}`}>{recommendationMessage}</p>}
            {recommendations.length > 0 && <div className="trip-recommendation-grid">{recommendations.map((recommendation, index) => {
              const converted = catalogTargetToTripTarget(recommendation.target);
              const isSelected = customTargets.some((target) => target.id === converted.id);
              return <article key={converted.id}>
                <div className="trip-recommendation-rank"><span>#{index + 1} tonight</span><b>{recommendation.score} match</b></div>
                <h3>{recommendationName(recommendation.target)}</h3>
                <p>{recommendationCode(recommendation.target)} · {targetTypeLabels[recommendation.target[1]] ?? recommendation.target[1]} · {recommendation.target[4]}</p>
                <dl>
                  <div><dt><Maximize2 size={12} /> Peak altitude</dt><dd>{Math.round(recommendation.peakAltitude)}°</dd></div>
                  <div><dt><Clock3 size={12} /> Best time</dt><dd>{formatTime(recommendation.bestTime)}</dd></div>
                  <div><dt><Moon size={12} /> Moon gap</dt><dd>{Math.round(recommendation.moonSeparation)}°</dd></div>
                  <div><dt><Telescope size={12} /> Size</dt><dd>{formatAngularSize(recommendation.sizeArcmin)}</dd></div>
                </dl>
                <div className="trip-recommendation-footer"><span>{recommendation.visibleHours.toFixed(1)} h visible · {recommendation.framing}</span><button onClick={() => addCatalogueTarget(recommendation.target)} disabled={isSelected}>{isSelected ? <Check size={14} /> : <Plus size={14} />}{isSelected ? "Selected" : "Add to trip"}</button></div>
              </article>;
            })}</div>}
            <p className="trip-recommendation-note">Uses astronomical darkness, altitude, Moon separation, catalogue brightness, and angular size. Times follow this device’s local clock; update your coordinates in step 2 before ranking a different location.</p>
          </div>
        </div>

        <div className="trip-step trip-location-step">
          <span className="trip-step-number">02</span>
          <div className="trip-step-heading"><MapPinned size={20} /><div><small>Starting point and range</small><h2>How far will you travel?</h2></div></div>
          <div className="trip-location-row">
            <div>
              <label>Latitude<input type="number" min="-90" max="90" step="0.0001" value={latitude} onChange={(event) => { setLatitude(Number(event.target.value)); setLocationName("Custom coordinates"); clearRecommendations(); }} /></label>
              <label>Longitude<input type="number" min="-180" max="180" step="0.0001" value={longitude} onChange={(event) => { setLongitude(Number(event.target.value)); setLocationName("Custom coordinates"); clearRecommendations(); }} /></label>
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
          <div><ShieldCheck size={16} /><p>Astronomy stays on-device. Long-range destination matching also stays on-device; nearby searches send rounded coordinates to OpenStreetMap’s public search service.</p></div>
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
        <div className="trip-results-heading"><div><p className="eyebrow">Scouting candidates</p><h2>Outdoor areas within {radiusKm} km · {miles(radiusKm)} mi</h2></div><p>Long-range searches use certified Dark Sky Parks, Reserves, and Sanctuaries. Nearby searches also include OpenStreetMap scouting features. Confirm access, safety, horizon, parking, permits, and current conditions before leaving.</p></div>
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
      <p>Certified-place coordinates come from <a href="https://www.wikidata.org/wiki/Wikidata:Licensing" target="_blank" rel="noreferrer">Wikidata (CC0)</a>, with designations from <a href="https://darksky.org/what-we-do/international-dark-sky-places/all-places/" target="_blank" rel="noreferrer">DarkSky International</a>. Nearby features © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>.</p>
    </footer>
  </main>;
}
