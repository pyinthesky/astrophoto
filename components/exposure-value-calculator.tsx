"use client";

import { useMemo, useState } from "react";
import { Gauge, Info } from "lucide-react";
import { calculateExposureValue, equivalentShutterSeconds } from "@/lib/exposure-value";

function NumberField({ id, label, value, onChange, suffix, min, max, step }: {
  id: string; label: string; value: number; onChange: (value: number) => void; suffix: string;
  min: number; max: number; step: number;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="input-shell">
        <input id={id} type="number" value={value} min={min} max={max} step={step}
          onChange={(event) => onChange(Number(event.target.value))} />
        <span>{suffix}</span>
      </span>
    </label>
  );
}

function formatShutter(seconds: number) {
  if (seconds >= 60) return `${(seconds / 60).toFixed(seconds >= 600 ? 0 : 1)} min`;
  if (seconds >= 1) return `${seconds.toFixed(seconds >= 10 ? 1 : 2)} sec`;
  const reciprocal = 1 / seconds;
  return `1/${Math.round(reciprocal)} sec`;
}

function changeDescription(sourceSeconds: number, targetSeconds: number) {
  const stops = Math.log2(targetSeconds / sourceSeconds);
  if (Math.abs(stops) < 0.05) return "Same shutter time";
  return `${Math.abs(stops).toFixed(1)} stop${Math.abs(stops) >= 1.05 ? "s" : ""} ${stops > 0 ? "longer" : "shorter"}`;
}

export function ExposureValueCalculator() {
  const [aperture, setAperture] = useState(2.8);
  const [shutterSeconds, setShutterSeconds] = useState(10);
  const [iso, setIso] = useState(3_200);
  const [targetAperture, setTargetAperture] = useState(4);
  const [targetIso, setTargetIso] = useState(6_400);

  const result = useMemo(() => {
    const ev = calculateExposureValue(aperture, shutterSeconds, iso);
    const targetShutter = equivalentShutterSeconds({ aperture, shutterSeconds, iso, targetAperture, targetIso });
    return ev && targetShutter ? { ...ev, targetShutter } : null;
  }, [aperture, shutterSeconds, iso, targetAperture, targetIso]);

  return (
    <article className="tool-card ev-card">
      <div className="tool-title"><Gauge size={20} /><div><span>05 · Exposure</span><h2>EV &amp; equivalent exposure</h2></div></div>
      <div className="ev-input-grid">
        <NumberField id="ev-aperture" label="Aperture" value={aperture} onChange={setAperture} suffix="f/" min={0.7} max={64} step={0.1} />
        <NumberField id="ev-shutter" label="Shutter" value={shutterSeconds} onChange={setShutterSeconds} suffix="sec" min={0.00001} max={86_400} step={0.1} />
        <NumberField id="ev-iso" label="ISO" value={iso} onChange={setIso} suffix="" min={1} max={1_638_400} step={100} />
      </div>

      {result ? <>
        <div className="tool-result-grid two-results ev-results">
          <span><small>Scene light level</small><strong>EV100 {result.sceneEv100.toFixed(1)}</strong></span>
          <span><small>Aperture + shutter</small><strong>EV {result.settingsEv.toFixed(1)}</strong></span>
        </div>

        <div className="ev-equivalent">
          <div><span>Equivalent exposure</span><b>Change aperture or ISO</b></div>
          <div className="tool-input-grid">
            <NumberField id="ev-target-aperture" label="New aperture" value={targetAperture} onChange={setTargetAperture} suffix="f/" min={0.7} max={64} step={0.1} />
            <NumberField id="ev-target-iso" label="New ISO" value={targetIso} onChange={setTargetIso} suffix="" min={1} max={1_638_400} step={100} />
          </div>
          <div className="ev-answer"><span>Matching shutter</span><strong>{formatShutter(result.targetShutter)}</strong><small>{changeDescription(shutterSeconds, result.targetShutter)}</small></div>
        </div>
      </> : <p className="ev-error">All exposure values must be above zero.</p>}

      <p className="tool-note"><Info size={14} /> Equivalent brightness does not override star motion: keep the new shutter at or below the NPF recommendation, then compensate with ISO or stacking.</p>
    </article>
  );
}
