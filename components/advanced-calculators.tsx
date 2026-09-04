"use client";

import { useMemo, useState } from "react";
import { Aperture, Calculator, Camera, Clock3, Crosshair, Grid3X3, Info, Sparkles, Telescope } from "lucide-react";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { PixelEtendueComparator } from "@/components/pixel-etendue-comparator";
import { brands, cameras } from "@/lib/cameras";
import { fieldOfView, integrationPlan, pixelScale, samplingAssessment, starDriftPixels } from "@/lib/calculators";
import { pixelPitch } from "@/lib/npf";

function NumberField({ id, label, value, onChange, suffix, min = 0, max, step = 1, hint }: {
  id: string; label: string; value: number; onChange: (value: number) => void; suffix: string;
  min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="input-shell">
        <input id={id} type="number" value={value} min={min} max={max} step={step}
          onChange={(event) => onChange(Number(event.target.value))} />
        <span>{suffix}</span>
      </span>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds.toFixed(0)} sec`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)} min`;
  return `${(seconds / 3_600).toFixed(2)} hr`;
}

export function AdvancedCalculators() {
  const [cameraId, setCameraId] = useState("sony-a7r-vi");
  const [focalLength, setFocalLength] = useState(16);
  const [seeing, setSeeing] = useState(2.5);
  const [testExposure, setTestExposure] = useState(6);
  const [declination, setDeclination] = useState(0);
  const [subExposure, setSubExposure] = useState(10);
  const [frames, setFrames] = useState(120);
  const [rejectPercent, setRejectPercent] = useState(10);
  const [overhead, setOverhead] = useState(2);

  const camera = cameras.find((item) => item.id === cameraId) ?? cameras[0];
  const pitch = pixelPitch(camera.sensorWidth, camera.imageWidth);
  const diagonal = Math.hypot(camera.sensorWidth, camera.sensorHeight);
  const results = useMemo(() => {
    const scale = pixelScale(pitch, focalLength);
    return {
      fov: {
        horizontal: fieldOfView(camera.sensorWidth, focalLength),
        vertical: fieldOfView(camera.sensorHeight, focalLength),
        diagonal: fieldOfView(diagonal, focalLength),
      },
      scale,
      sampling: samplingAssessment(seeing, scale),
      drift: starDriftPixels(testExposure, declination, scale),
      session: integrationPlan({ subExposureSeconds: subExposure, frames, rejectPercent, overheadSeconds: overhead }),
    };
  }, [camera, diagonal, pitch, focalLength, seeing, testExposure, declination, subExposure, frames, rejectPercent, overhead]);

  return (
    <main>
      <SiteHeader active="calculators" />
      <section className="calculators-shell">
        <div className="calculators-hero">
          <div>
            <p className="eyebrow"><Sparkles size={14} /> Advanced astrophotography calculators</p>
            <h1>Plan the frame.<br /><em>Understand the pixels.</em></h1>
          </div>
          <p>Five practical tools cover framing, image sampling, visible star drift, integration time, and side-by-side optical setup performance.</p>
        </div>

        <section className="setup-card" aria-label="Shared optical setup">
          <div className="setup-heading"><Camera size={20} /><div><span>Shared setup</span><b>Camera and optics</b></div></div>
          <div className="setup-fields">
            <div className="field">
              <span className="field-label">Camera body</span>
              <Select value={cameraId} onValueChange={setCameraId}>
                <SelectTrigger className="camera-trigger" aria-label="Camera body"><Camera size={17} /><SelectValue /></SelectTrigger>
                <SelectContent position="popper" className="camera-menu">
                  {brands.map((brand) => <SelectGroup key={brand}><SelectLabel>{brand}</SelectLabel>
                    {cameras.filter((item) => item.brand === brand).map((item) =>
                      <SelectItem key={item.id} value={item.id}>{item.model}<span className="select-year">{item.year}</span></SelectItem>)}
                  </SelectGroup>)}
                </SelectContent>
              </Select>
            </div>
            <NumberField id="tool-focal-length" label="Focal length" value={focalLength} onChange={setFocalLength} suffix="mm" min={1} max={3_000} />
          </div>
          <div className="setup-readout">
            <span><small>Sensor</small><b>{camera.sensorWidth.toFixed(1)} × {camera.sensorHeight.toFixed(1)} mm</b></span>
            <span><small>Native image</small><b>{camera.imageWidth.toLocaleString()} × {camera.imageHeight.toLocaleString()} px</b></span>
            <span><small>Pixel pitch</small><b>{pitch.toFixed(2)} µm</b></span>
          </div>
        </section>

        <div className="advanced-grid">
          <article className="tool-card">
            <div className="tool-title"><Grid3X3 size={20} /><div><span>01 · Framing</span><h2>Sensor field of view</h2></div></div>
            <div className="tool-result-grid fov-results">
              <span><small>Horizontal</small><strong>{results.fov.horizontal.toFixed(2)}°</strong></span>
              <span><small>Vertical</small><strong>{results.fov.vertical.toFixed(2)}°</strong></span>
              <span><small>Diagonal</small><strong>{results.fov.diagonal.toFixed(2)}°</strong></span>
            </div>
            <p className="tool-note"><Info size={14} /> Rectilinear lens geometry at infinity; distortion and focus breathing can change the real frame.</p>
          </article>

          <article className="tool-card">
            <div className="tool-title"><Telescope size={20} /><div><span>02 · Detail</span><h2>Image scale &amp; sampling</h2></div></div>
            <NumberField id="seeing" label="Seeing FWHM" value={seeing} onChange={setSeeing} suffix="arcsec" min={0.1} max={20} step={0.1} hint="Most useful with a tracked telescope; use a local measured value when possible." />
            <div className="tool-result-grid two-results">
              <span><small>Image scale</small><strong>{results.scale.toFixed(2)}″/px</strong></span>
              <span><small>Seeing footprint</small><strong>{results.sampling.pixelsPerFwhm.toFixed(2)} px</strong></span>
            </div>
            <div className={`assessment ${results.sampling.assessment.toLowerCase().replace("-", "")}`}>
              <b>{results.sampling.assessment}</b><span>2–4 pixels across the seeing disc is a practical reference range.</span>
            </div>
          </article>

          <article className="tool-card">
            <div className="tool-title"><Crosshair size={20} /><div><span>03 · Motion</span><h2>Star drift on the sensor</h2></div></div>
            <div className="tool-input-grid">
              <NumberField id="drift-exposure" label="Exposure" value={testExposure} onChange={setTestExposure} suffix="sec" min={0} max={3_600} step={0.1} />
              <NumberField id="drift-declination" label="Declination" value={declination} onChange={setDeclination} suffix="°" min={-90} max={90} step={1} />
            </div>
            <div className="drift-result"><strong>{results.drift.pixels.toFixed(2)}</strong><span>pixels of idealized sky motion</span></div>
            <p className="tool-note"><Info size={14} /> {results.drift.angularDrift.toFixed(1)} arcsec at the sidereal rate. This isolates Earth rotation; the NPF calculator also models diffraction and viewing tolerance.</p>
          </article>

          <article className="tool-card">
            <div className="tool-title"><Clock3 size={20} /><div><span>04 · Session</span><h2>Integration planner</h2></div></div>
            <div className="tool-input-grid session-inputs">
              <NumberField id="sub-exposure" label="Sub-exposure" value={subExposure} onChange={setSubExposure} suffix="sec" min={0.1} max={7_200} step={0.1} />
              <NumberField id="frame-count" label="Frames" value={frames} onChange={setFrames} suffix="shots" min={1} max={100_000} />
              <NumberField id="reject-rate" label="Expected rejects" value={rejectPercent} onChange={setRejectPercent} suffix="%" min={0} max={100} step={1} />
              <NumberField id="frame-overhead" label="Gap / overhead" value={overhead} onChange={setOverhead} suffix="sec" min={0} max={600} step={0.1} />
            </div>
            <div className="tool-result-grid session-results">
              <span><small>Usable frames</small><strong>{results.session.usableFrames}</strong></span>
              <span><small>Integration</small><strong>{formatDuration(results.session.integrationSeconds)}</strong></span>
              <span><small>Clock time</small><strong>{formatDuration(results.session.sessionSeconds)}</strong></span>
              <span><small>Capture duty</small><strong>{(results.session.dutyCycle * 100).toFixed(1)}%</strong></span>
            </div>
            <p className="tool-note"><Info size={14} /> Clock time excludes setup, dithering pauses, meridian flips, and changing twilight.</p>
          </article>
        </div>

        <PixelEtendueComparator
          sharedPixelPitch={pitch}
          sharedFocalLength={focalLength}
          sharedCameraName={camera.model}
        />

        <section className="calculator-methods">
          <div><Aperture size={19} /><span><b>Field of view</b><small>2 × atan(sensor dimension ÷ 2f)</small></span></div>
          <div><Telescope size={19} /><span><b>Image scale</b><small>Angular width of one pixel at focal length f</small></span></div>
          <div><Crosshair size={19} /><span><b>Star drift</b><small>15.041 arcsec/s × cos(declination) × exposure</small></span></div>
          <div><Calculator size={19} /><span><b>Pixel étendue</b><small>(d² − o²) × throughput × pixel scale²</small></span></div>
        </section>
      </section>
      <footer>
        <p>These are planning estimates for ideal rectilinear optics. Lens distortion, atmospheric refraction, guiding, optical blur, and processing can change measured results.</p>
        <p>Sampling guidance describes seeing-limited tracked imaging; it is not a quality score for wide-angle nightscapes.</p>
      </footer>
    </main>
  );
}
