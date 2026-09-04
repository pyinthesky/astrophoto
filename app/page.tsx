"use client";

import { useEffect, useMemo, useState } from "react";
import { Aperture, Camera, CircleHelp, Compass, Crosshair, Info, ScanLine, Sparkles } from "lucide-react";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SiteHeader } from "@/components/site-header";
import { brands, cameras } from "@/lib/cameras";
import { readCameraPreference, saveCameraPreference } from "@/lib/camera-preference";
import { focalLengthToSlider, sliderToFocalLength } from "@/lib/focal-slider";
import { formatSeconds, fourCropRule, frameMap, fullNpf, pixelPitch, rule500, simplifiedNpf } from "@/lib/npf";

const shutterStops = [30, 25, 20, 15, 13, 10, 8, 6, 5, 4, 3.2, 2.5, 2, 1.6, 1.3, 1, 0.8, 0.6, 0.5, 0.4, 0.3, 0.25];

function safeShutter(seconds: number) {
  return shutterStops.find((stop) => stop <= seconds) ?? Math.max(0.1, Math.floor(seconds * 10) / 10);
}

function NumberField({ id, label, value, onChange, suffix, min, max, step = 1, hint }: {
  id: string; label: string; value: number; onChange: (value: number) => void; suffix?: string;
  min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="input-shell">
        <input id={id} type="number" value={value} min={min} max={max} step={step}
          onChange={(event) => onChange(Number(event.target.value))} />
        {suffix && <span>{suffix}</span>}
      </span>
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function Home() {
  const [cameraId, setCameraId] = useState("sony-a7r-vi");
  const [customCamera, setCustomCamera] = useState(false);
  const selectedCamera = cameras.find((camera) => camera.id === cameraId) ?? cameras[0];
  const [sensorWidth, setSensorWidth] = useState(35.9);
  const [sensorHeight, setSensorHeight] = useState(24);
  const [imageWidth, setImageWidth] = useState(9984);
  const [focalLength, setFocalLength] = useState(16);
  const [apertureValue, setApertureValue] = useState(2.8);
  const [accuracy, setAccuracy] = useState(1);
  const [declination, setDeclination] = useState(0);
  const [mapMode, setMapMode] = useState(false);
  const [latitude, setLatitude] = useState(39.1);
  const [azimuth, setAzimuth] = useState(180);
  const [altitude, setAltitude] = useState(35);
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const savedCamera = readCameraPreference(cameras.map((camera) => camera.id));
    const cameraTimer = savedCamera ? window.setTimeout(() => setCameraId(savedCamera), 0) : undefined;
    const value = Number(new URLSearchParams(window.location.search).get("declination"));
    const declinationTimer = Number.isFinite(value) && value >= -89 && value <= 89
      ? window.setTimeout(() => {
        setDeclination(value);
        setMapMode(false);
      }, 0)
      : undefined;
    return () => {
      if (cameraTimer) window.clearTimeout(cameraTimer);
      if (declinationTimer) window.clearTimeout(declinationTimer);
    };
  }, []);

  const activeSensorWidth = customCamera ? sensorWidth : selectedCamera.sensorWidth;
  const activeSensorHeight = customCamera ? sensorHeight : selectedCamera.sensorHeight;
  const activeImageWidth = customCamera ? imageWidth : selectedCamera.imageWidth;
  const pitch = pixelPitch(activeSensorWidth, activeImageWidth);
  const cells = useMemo(() => frameMap({ latitude, azimuth, altitude, focalLength, sensorWidth: activeSensorWidth,
    sensorHeight: activeSensorHeight, aperture: apertureValue, pitch, accuracy, portrait }),
    [latitude, azimuth, altitude, focalLength, activeSensorWidth, activeSensorHeight, apertureValue, pitch, accuracy, portrait]);

  const directResult = fullNpf(apertureValue, focalLength, pitch, declination, accuracy);
  const mapResult = Math.min(...cells.map((cell) => cell.exposure));
  const recommended = mapMode ? mapResult : directResult;
  const dialIn = safeShutter(recommended);
  const simpleResult = simplifiedNpf(apertureValue, focalLength, pitch);
  const legacyResult = rule500(focalLength, activeSensorWidth);
  const cropResult = fourCropRule(focalLength, activeSensorWidth);

  const handleCamera = (id: string) => {
    setCameraId(id);
    setCustomCamera(false);
    saveCameraPreference(id);
  };

  return (
    <main>
      <SiteHeader active="exposure" />

      <section className="workspace" id="top">
        <div className="intro">
          <div><p className="eyebrow"><Sparkles size={14} /> Untracked nightscapes</p>
            <h1>Sharp stars,<br /><em>before they trail.</em></h1></div>
          <p className="intro-copy">A modern rebuild of Frédéric Michaud’s NPF calculator. It accounts for pixel density, aperture, focal length, and where you point in the sky.</p>
        </div>

        <div className="calculator-grid">
          <section className="controls-panel" aria-label="Exposure inputs">
            <div className="panel-heading"><span className="step-number">01</span><div><p>Camera</p><h2>Choose your sensor</h2></div></div>
            <div className="field">
              <span className="field-label">Camera body</span>
              <Select value={cameraId} onValueChange={handleCamera} disabled={customCamera}>
                <SelectTrigger className="camera-trigger" aria-label="Camera body"><Camera size={17} /><SelectValue /></SelectTrigger>
                <SelectContent position="popper" className="camera-menu">
                  {brands.map((brand) => <SelectGroup key={brand}><SelectLabel>{brand}</SelectLabel>
                    {cameras.filter((camera) => camera.brand === brand).map((camera) =>
                      <SelectItem key={camera.id} value={camera.id}>{camera.model}<span className="select-year">{camera.year}</span></SelectItem>)}
                  </SelectGroup>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sensor-readout">
              <div><span>Sensor</span><b>{activeSensorWidth.toFixed(1)} × {activeSensorHeight.toFixed(1)} mm</b></div>
              <div><span>Native image</span><b>{activeImageWidth.toLocaleString()} px wide</b></div>
              <div className="pitch"><span>Pixel pitch</span><b>{pitch.toFixed(2)} µm</b></div>
            </div>
            <div className="toggle-row"><div><b>Custom sensor</b><span>For any camera not listed</span></div>
              <Switch checked={customCamera} onCheckedChange={setCustomCamera} aria-label="Use a custom sensor" /></div>
            {customCamera && <div className="custom-grid">
              <NumberField id="sensor-width" label="Width" value={sensorWidth} onChange={setSensorWidth} suffix="mm" min={1} step={0.1} />
              <NumberField id="sensor-height" label="Height" value={sensorHeight} onChange={setSensorHeight} suffix="mm" min={1} step={0.1} />
              <NumberField id="image-width" label="Image width" value={imageWidth} onChange={setImageWidth} suffix="px" min={100} />
            </div>}

            <div className="section-rule" />
            <div className="panel-heading compact"><span className="step-number">02</span><div><p>Lens</p><h2>Set the exposure</h2></div></div>
            <div className="lens-grid">
              <NumberField id="focal-length" label="Focal length" value={focalLength} onChange={setFocalLength} suffix="mm" min={1} max={800} />
              <NumberField id="aperture" label="Aperture" value={apertureValue} onChange={setApertureValue} suffix="f/" min={0.7} max={32} step={0.1} />
            </div>
            <div className="slider-block"><Slider value={[focalLengthToSlider(focalLength)]} onValueChange={([value]) => setFocalLength(sliderToFocalLength(value))} min={0} max={100} step={0.5} aria-label="Focal length" aria-valuetext={`${focalLength} mm`} />
              <div className="slider-scale"><span>8 mm</span><span>25</span><span>75</span><span>250 mm</span></div></div>
            <div className="field accuracy-field"><span className="field-label">Star sharpness</span>
              <Select value={String(accuracy)} onValueChange={(value) => setAccuracy(Number(value))}>
                <SelectTrigger className="wide-trigger" aria-label="Star sharpness"><Crosshair size={17} /><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Pinpoint · k = 1</SelectItem><SelectItem value="2">Slight trail · k = 2</SelectItem><SelectItem value="3">Visible trail · k = 3</SelectItem></SelectContent>
              </Select><small>Pinpoint is the conservative choice for 100% viewing and large prints.</small></div>

            <div className="section-rule" />
            <div className="panel-heading compact"><span className="step-number">03</span><div><p>Sky position</p><h2>Tell us where you’re aiming</h2></div></div>
            <div className="mode-tabs" role="group" aria-label="Sky position mode">
              <button className={!mapMode ? "active" : ""} onClick={() => setMapMode(false)}>Declination</button>
              <button className={mapMode ? "active" : ""} onClick={() => setMapMode(true)}>Frame map</button>
            </div>
            {!mapMode ? <div className="declination-control"><NumberField id="declination" label="Minimum declination" value={declination} onChange={setDeclination} suffix="°" min={-89} max={89} hint="Use 0° when unknown—the safest general value." /></div>
              : <div className="map-controls"><div className="three-grid">
                <NumberField id="latitude" label="Latitude" value={latitude} onChange={setLatitude} suffix="°" min={-90} max={90} step={0.1} />
                <NumberField id="azimuth" label="Azimuth" value={azimuth} onChange={setAzimuth} suffix="°" min={0} max={360} />
                <NumberField id="altitude" label="Altitude" value={altitude} onChange={setAltitude} suffix="°" min={-10} max={90} />
              </div><div className="toggle-row orientation"><div><b>Portrait frame</b><span>Rotate the sensor field of view</span></div>
                <Switch checked={portrait} onCheckedChange={setPortrait} aria-label="Portrait orientation" /></div></div>}
          </section>

          <aside className="results-column" aria-live="polite">
            <section className="result-card">
              <div className="result-topline"><span>Recommended shutter</span><ScanLine size={19} /></div>
              <div className="dial-value"><strong>{formatSeconds(dialIn).replace(" s", "")}</strong><span>seconds</span></div>
              <p>Calculated limit <b>{formatSeconds(recommended)}</b> · dialed down to a common shutter speed.</p>
              <div className="exposure-summary"><div><Aperture size={17} /><span>f/{apertureValue}</span></div><div><Compass size={17} /><span>{focalLength} mm</span></div><div><Crosshair size={17} /><span>k = {accuracy}</span></div></div>
            </section>
            {mapMode && <section className="frame-card">
              <div className="card-title-row"><div><p>Across your frame</p><h3>Exposure map</h3></div><span>min {formatSeconds(mapResult)}</span></div>
              <div className={portrait ? "frame-map portrait" : "frame-map"}>{cells.map((cell) =>
                <div key={`${cell.row}-${cell.column}`} className={cell.exposure === mapResult ? "critical" : ""}><strong>{formatSeconds(cell.exposure)}</strong><span>δ {cell.declination > 0 ? "+" : ""}{cell.declination.toFixed(0)}°</span></div>)}</div>
              <p className="map-note"><Info size={15} /> Recommendation uses the fastest-moving region of the frame.</p>
            </section>}
            <section className="comparison-card">
              <div className="card-title-row"><div><p>Method check</p><h3>Other rules</h3></div></div>
              <div className="comparison-list">
                <div className="featured"><span><b>Full NPF</b><small>declination-aware</small></span><strong>{formatSeconds(recommended)}</strong></div>
                <div><span><b>Simplified NPF</b><small>quick estimate</small></span><strong>{formatSeconds(simpleResult)}</strong></div>
                <div><span><b>4–Crop rule</b><small>sensor shortcut</small></span><strong>{formatSeconds(cropResult)}</strong></div>
                <div className="legacy"><span><b>500 rule</b><small>legacy · often too long</small></span><strong>{formatSeconds(legacyResult)}</strong></div>
              </div>
            </section>
            <div className="field-tip"><CircleHelp size={18} /><p><b>Field tip</b> Start at the recommended dial setting, magnify a test frame, then shorten it if your lens has coma or you plan to crop heavily.</p></div>
          </aside>
        </div>
      </section>

      <section className="method-section">
        <div className="method-copy"><p className="eyebrow">The recovered method</p><h2>Why the NPF rule beats the 500 rule</h2>
          <p>The old shortcut only knows focal length and crop factor. NPF also models diffraction, pixel pitch, and apparent sky motion, so a high-resolution sensor gets a shorter—and much more realistic—limit.</p></div>
        <div className="formula-card"><span>Full NPF formula</span><div className="formula"><i>t</i> = <span className="fraction"><b>k · (16.9<i>N</i> + 0.10<i>f</i> + 13.7<i>p</i>)</b><b><i>f</i> · cos(<i>δ</i>)</b></span></div>
          <div className="formula-key"><span><b>N</b> aperture</span><span><b>p</b> pixel pitch</span><span><b>f</b> focal length</span><span><b>δ</b> declination</span></div></div>
      </section>

      <section className="guide-section" aria-labelledby="npf-guide-title">
        <div className="guide-heading">
          <p className="eyebrow">Astrophotography exposure guide</p>
          <h2 id="npf-guide-title">Get pinpoint stars without guessing</h2>
          <p>The NPF rule estimates how long a fixed camera can expose before Earth’s rotation turns stars into visible streaks. Use the calculated setting as a conservative starting point, then inspect a magnified test frame.</p>
        </div>
        <div className="guide-grid">
          <article><span>01</span><h3>Pixel pitch matters</h3><p>Higher-resolution sensors reveal movement sooner. The calculator derives pixel pitch from each camera’s sensor width and native image resolution.</p></article>
          <article><span>02</span><h3>Direction matters</h3><p>Stars near the celestial equator move across the frame fastest. Declination and the frame map account for where the camera is pointed.</p></article>
          <article><span>03</span><h3>The 500 rule is generous</h3><p>The traditional 500 rule ignores pixel density and aperture, so it commonly recommends exposures that look trailed at full resolution.</p></article>
        </div>
        <div className="faq-list">
          <details><summary>Which sharpness setting should I use?</summary><p>Choose Pinpoint (k = 1) for high-resolution cameras, heavy cropping, or large prints. The looser settings intentionally accept progressively more star movement.</p></details>
          <details><summary>What declination should I enter?</summary><p>Use the declination of the lowest-declination star in your composition. If you do not know it, 0° is the safest general value, or use the Sky Planner to select a target.</p></details>
          <details><summary>Does image stabilization change the limit?</summary><p>No. Stabilization can reduce camera shake, but it cannot cancel Earth’s rotation relative to the stars. A tracking mount is required for longer pinpoint exposures.</p></details>
        </div>
      </section>

      <footer><p>NPF formula by <a href="https://sahavre.fr/wp/regle-npf-rule/" target="_blank" rel="noreferrer">Frédéric Michaud, Société Astronomique du Havre</a>. Rebuilt from the <a href="https://web.archive.org/web/20200220123345/https://www.sahavre.fr/tutoriels/astrophoto/34-regle-npf-temps-de-pose-pour-eviter-le-file-d-etoiles" target="_blank" rel="noreferrer">archived calculator</a>.</p>
        <p>Sensor profiles verified against current manufacturer specifications. Always use native full-resolution dimensions.</p></footer>
    </main>
  );
}
