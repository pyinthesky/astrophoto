"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Clock3, Grid3X3, Info, Search, Sparkles, Target, Telescope } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { brands, cameras } from "@/lib/cameras";
import { readCameraPreference, saveCameraPreference } from "@/lib/camera-preference";
import { calculateMosaicPlan, type MosaicOrientation, type MosaicPlan } from "@/lib/mosaic";
import { formatDeclination, formatRightAscension, loadTargetCatalog, normalizeTargetSearch, targetSearchText, type TargetTuple } from "@/lib/targets";

const andromeda: TargetTuple = ["NGC 224", "G", 0.71232, 41.26906, "And", 177.83, 69.66, 3.44, "M 31", "Andromeda Galaxy"];

function NumberField({ id, label, value, onChange, suffix, min = 0, max, step = 1, hint }: {
  id: string; label: string; value: number; onChange: (value: number) => void; suffix: string;
  min?: number; max?: number; step?: number; hint?: string;
}) {
  return <label className="field" htmlFor={id}>
    <span className="field-label">{label}</span>
    <span className="input-shell"><input id={id} type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /><span>{suffix}</span></span>
    {hint && <small>{hint}</small>}
  </label>;
}

function formatAngle(arcminutes: number) {
  return arcminutes >= 60 ? `${(arcminutes / 60).toFixed(2)}°` : `${arcminutes.toFixed(1)}′`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
}

function displayTargetName(target: TargetTuple) {
  const common = target[9].split(",")[0];
  const alias = target[8].split("|").find((value) => /^M \d+$|^Caldwell \d+$/.test(value));
  return [common || target[0], alias || (common ? target[0] : "")].filter(Boolean).join(" · ");
}

function MosaicDiagram({ plan, targetWidth, targetHeight, targetAngle }: { plan: MosaicPlan; targetWidth: number; targetHeight: number; targetAngle: number }) {
  if (plan.panelCount > 144) return <div className="mosaic-diagram-limit"><Grid3X3 size={23} /><p>This setup needs too many panels for a useful diagram. The totals remain accurate; try a wider field or a smaller target.</p></div>;
  const viewWidth = 720;
  const viewHeight = 440;
  const inset = 26;
  const scale = Math.min((viewWidth - inset * 2) / plan.mosaicWidthArcmin, (viewHeight - inset * 2) / plan.mosaicHeightArcmin);
  const mosaicWidth = plan.mosaicWidthArcmin * scale;
  const mosaicHeight = plan.mosaicHeightArcmin * scale;
  const originX = (viewWidth - mosaicWidth) / 2;
  const originY = (viewHeight - mosaicHeight) / 2;

  return <svg className="mosaic-diagram" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={`${plan.columns} by ${plan.rows} mosaic with ${plan.panelCount} panels`}>
    <rect className="mosaic-backdrop" x={originX} y={originY} width={mosaicWidth} height={mosaicHeight} rx="12" />
    <ellipse className="mosaic-target-shape" cx={viewWidth / 2} cy={viewHeight / 2} rx={targetWidth * scale / 2} ry={targetHeight * scale / 2} transform={`rotate(${-targetAngle} ${viewWidth / 2} ${viewHeight / 2})`} />
    {plan.panels.map((panel) => {
      const x = originX + plan.mosaicWidthArcmin * scale / 2 + (panel.offsetXArcmin - plan.frameWidthArcmin / 2) * scale;
      const y = originY + plan.mosaicHeightArcmin * scale / 2 - (panel.offsetYArcmin + plan.frameHeightArcmin / 2) * scale;
      return <g key={panel.order}>
        <rect className="mosaic-panel" x={x} y={y} width={plan.frameWidthArcmin * scale} height={plan.frameHeightArcmin * scale} rx="7" />
        <text x={x + plan.frameWidthArcmin * scale / 2} y={y + plan.frameHeightArcmin * scale / 2 + 5} textAnchor="middle">{panel.order}</text>
      </g>;
    })}
    <line className="mosaic-crosshair" x1={viewWidth / 2 - 8} y1={viewHeight / 2} x2={viewWidth / 2 + 8} y2={viewHeight / 2} />
    <line className="mosaic-crosshair" x1={viewWidth / 2} y1={viewHeight / 2 - 8} x2={viewWidth / 2} y2={viewHeight / 2 + 8} />
  </svg>;
}

export function MosaicPlanner() {
  const [cameraId, setCameraId] = useState("sony-a7r-vi");
  const [focalLength, setFocalLength] = useState(600);
  const [orientation, setOrientation] = useState<MosaicOrientation>("landscape");
  const [overlap, setOverlap] = useState(20);
  const [margin, setMargin] = useState(10);
  const [targetAngle, setTargetAngle] = useState(0);
  const [targetWidth, setTargetWidth] = useState(andromeda[5] ?? 177.83);
  const [targetHeight, setTargetHeight] = useState(andromeda[6] ?? 69.66);
  const [selectedTarget, setSelectedTarget] = useState<TargetTuple | null>(andromeda);
  const [targetName, setTargetName] = useState(displayTargetName(andromeda));
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<TargetTuple[]>([]);
  const [catalogState, setCatalogState] = useState("Loading catalogue…");
  const [integrationMinutes, setIntegrationMinutes] = useState(60);
  const [transitionMinutes, setTransitionMinutes] = useState(5);

  useEffect(() => {
    const savedCamera = readCameraPreference(cameras.map((camera) => camera.id));
    const params = new URLSearchParams(window.location.search);
    const linkedName = params.get("target");
    const linkedWidth = Number(params.get("width"));
    const linkedHeight = Number(params.get("height"));
    const linkedRa = params.has("ra") ? Number(params.get("ra")) : Number.NaN;
    const linkedDec = params.has("dec") ? Number(params.get("dec")) : Number.NaN;
    const timer = window.setTimeout(() => {
      if (savedCamera) setCameraId(savedCamera);
      if (linkedName && linkedWidth > 0) {
        const linkedTarget: TargetTuple = [linkedName, "Other", linkedRa, linkedDec, "", linkedWidth, linkedHeight > 0 ? linkedHeight : linkedWidth, null, "", ""];
        setSelectedTarget(linkedTarget);
        setTargetName(linkedName);
        setTargetWidth(linkedWidth);
        setTargetHeight(linkedHeight > 0 ? linkedHeight : linkedWidth);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadTargetCatalog()
      .then((payload) => { setCatalog(payload.objects); setCatalogState(`${payload.objects.length.toLocaleString()} objects ready`); })
      .catch(() => setCatalogState("Catalogue unavailable · manual dimensions still work"));
  }, []);

  const camera = cameras.find((item) => item.id === cameraId) ?? cameras[0];
  const plan = useMemo(() => calculateMosaicPlan({
    sensorWidthMm: camera.sensorWidth,
    sensorHeightMm: camera.sensorHeight,
    imageWidthPixels: camera.imageWidth,
    imageHeightPixels: camera.imageHeight,
    focalLengthMm: focalLength,
    targetWidthArcmin: targetWidth,
    targetHeightArcmin: targetHeight,
    targetAngleDegrees: targetAngle,
    overlapPercent: overlap,
    marginPercent: margin,
    orientation,
    rightAscensionHours: selectedTarget ? selectedTarget[2] : null,
    declinationDegrees: selectedTarget ? selectedTarget[3] : null,
    integrationMinutesPerPanel: integrationMinutes,
    transitionMinutes,
  }), [camera, focalLength, integrationMinutes, margin, orientation, overlap, selectedTarget, targetAngle, targetHeight, targetWidth, transitionMinutes]);

  const matches = useMemo(() => {
    const needle = normalizeTargetSearch(query);
    if (needle.length < 2) return [];
    return catalog
      .filter((target) => target[5] !== null && targetSearchText(target).includes(needle))
      .sort((a, b) => {
        const aName = normalizeTargetSearch(`${a[0]} ${a[8]} ${a[9]}`);
        const bName = normalizeTargetSearch(`${b[0]} ${b[8]} ${b[9]}`);
        return Number(!aName.startsWith(needle)) - Number(!bName.startsWith(needle));
      })
      .slice(0, 8);
  }, [catalog, query]);

  function chooseTarget(target: TargetTuple) {
    setSelectedTarget(target);
    setTargetName(displayTargetName(target));
    setTargetWidth(target[5] ?? 1);
    setTargetHeight(target[6] ?? target[5] ?? 1);
    setQuery("");
  }

  function handleCamera(id: string) {
    setCameraId(id);
    saveCameraPreference(id);
  }

  return <main>
    <SiteHeader active="calculators" />
    <section className="mosaic-shell">
      <div className="mosaic-hero">
        <div><p className="eyebrow"><Grid3X3 size={14} /> Mosaic planner</p><h1>Build the whole frame.</h1></div>
        <p>Turn a camera, focal length, and target size into a practical overlapping panel sequence.</p>
      </div>

      <div className="mosaic-workspace">
        <section className="mosaic-controls" aria-label="Mosaic setup">
          <div className="mosaic-section-title"><span>01</span><div><small>Optical setup</small><h2>Camera and framing</h2></div></div>
          <div className="mosaic-two-fields">
            <div className="field"><span className="field-label">Camera</span><Select value={cameraId} onValueChange={handleCamera}><SelectTrigger className="camera-trigger" aria-label="Camera"><Camera size={17} /><SelectValue /></SelectTrigger><SelectContent position="popper" className="camera-menu">{brands.map((brand) => <SelectGroup key={brand}><SelectLabel>{brand}</SelectLabel>{cameras.filter((item) => item.brand === brand).map((item) => <SelectItem key={item.id} value={item.id}>{item.model}<span className="select-year">{item.year}</span></SelectItem>)}</SelectGroup>)}</SelectContent></Select></div>
            <NumberField id="mosaic-focal" label="Focal length" value={focalLength} onChange={setFocalLength} suffix="mm" min={1} max={5_000} />
          </div>
          <div className="mosaic-orientation" aria-label="Sensor orientation"><button className={orientation === "landscape" ? "active" : ""} onClick={() => setOrientation("landscape")}>Landscape</button><button className={orientation === "portrait" ? "active" : ""} onClick={() => setOrientation("portrait")}>Portrait</button></div>

          <div className="mosaic-section-title"><span>02</span><div><small>Subject footprint</small><h2>Target and coverage</h2></div></div>
          <div className="mosaic-target-selected"><Target size={16} /><span><small>Current target</small><b>{targetName || "Manual target"}</b></span></div>
          <label className="mosaic-target-search"><Search size={16} /><span className="sr-only">Search target catalogue</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search M31, Orion, NGC 7000…" /><small>{catalogState}</small></label>
          {matches.length > 0 && <div className="mosaic-target-matches">{matches.map((target) => <button key={`${target[0]}-${target[2]}`} onClick={() => chooseTarget(target)}><span><b>{displayTargetName(target)}</b><small>{target[5]?.toFixed(1)}′ × {(target[6] ?? target[5])?.toFixed(1)}′</small></span><Target size={14} /></button>)}</div>}
          <div className="mosaic-two-fields mosaic-target-fields">
            <NumberField id="mosaic-target-width" label="Target width" value={targetWidth} onChange={(value) => { setTargetWidth(value); setTargetName(selectedTarget ? targetName : "Manual target"); }} suffix="arcmin" min={0.1} max={3_600} step={0.1} />
            <NumberField id="mosaic-target-height" label="Target height" value={targetHeight} onChange={(value) => { setTargetHeight(value); setTargetName(selectedTarget ? targetName : "Manual target"); }} suffix="arcmin" min={0.1} max={3_600} step={0.1} />
            <NumberField id="mosaic-target-angle" label="Target angle" value={targetAngle} onChange={setTargetAngle} suffix="°" min={-180} max={180} step={1} hint="Rotate the target footprint relative to the frame." />
            <NumberField id="mosaic-overlap" label="Panel overlap" value={overlap} onChange={setOverlap} suffix="%" min={0} max={90} step={1} hint="15–25% is a practical stitching range." />
            <NumberField id="mosaic-margin" label="Framing margin" value={margin} onChange={setMargin} suffix="% / side" min={0} max={200} step={1} />
          </div>

          <div className="mosaic-section-title"><span>03</span><div><small>Session estimate</small><h2>Time per panel</h2></div></div>
          <div className="mosaic-two-fields"><NumberField id="mosaic-integration" label="Integration per panel" value={integrationMinutes} onChange={setIntegrationMinutes} suffix="min" min={1} max={10_000} /><NumberField id="mosaic-transition" label="Move / settle between panels" value={transitionMinutes} onChange={setTransitionMinutes} suffix="min" min={0} max={120} /></div>
        </section>

        <section className="mosaic-output" aria-live="polite">
          <div className="mosaic-answer">
            <div><span>Recommended mosaic</span><strong>{plan.columns} × {plan.rows}</strong><b>{plan.panelCount} {plan.panelCount === 1 ? "panel" : "panels"}</b></div>
            <div className="mosaic-answer-stats"><span><small>Single frame</small><b>{formatAngle(plan.frameWidthArcmin)} × {formatAngle(plan.frameHeightArcmin)}</b></span><span><small>Stitched field</small><b>{formatAngle(plan.mosaicWidthArcmin)} × {formatAngle(plan.mosaicHeightArcmin)}</b></span><span><small>Total capture</small><b>{formatDuration(plan.totalCaptureMinutes)}</b></span></div>
          </div>
          <div className="mosaic-visual-card"><div className="mosaic-visual-heading"><span><small>Numbered capture sequence</small><b>Serpentine panel order</b></span><em>{overlap}% overlap</em></div><MosaicDiagram plan={plan} targetWidth={targetWidth} targetHeight={targetHeight} targetAngle={targetAngle} /></div>
          <div className="mosaic-output-grid"><span><small>Target + margin</small><b>{formatAngle(plan.requiredWidthArcmin)} × {formatAngle(plan.requiredHeightArcmin)}</b></span><span><small>Estimated stitched canvas</small><b>{Math.round(plan.stitchedWidthPixels).toLocaleString()} × {Math.round(plan.stitchedHeightPixels).toLocaleString()} px</b></span><span><small>Uncropped resolution</small><b>{plan.stitchedMegapixels.toFixed(1)} MP</b></span><span><small>Panel step</small><b>{formatAngle(plan.stepWidthArcmin)} RA × {formatAngle(plan.stepHeightArcmin)} Dec</b></span></div>
          {selectedTarget && <div className="mosaic-panel-list"><div className="mosaic-panel-heading"><span><small>Approximate J2000 centers</small><b>Panel coordinates</b></span><em>{displayTargetName(selectedTarget)}</em></div><div className="mosaic-panel-table">{plan.panels.slice(0, 60).map((panel) => <div key={panel.order}><b>{String(panel.order).padStart(2, "0")}</b><span>{panel.rightAscensionHours === null ? "—" : formatRightAscension(panel.rightAscensionHours)}</span><span>{panel.declinationDegrees === null ? "—" : formatDeclination(panel.declinationDegrees)}</span></div>)}</div>{plan.panelCount > 60 && <p>Showing the first 60 of {plan.panelCount} panel centers.</p>}</div>}
          <p className="mosaic-caveat"><Info size={15} /> Catalogue dimensions describe the listed object, not necessarily its faint photographic outskirts. Margin helps, but verify framing in your capture software. Panel centers use a tangent-plane approximation and become less reliable near the celestial poles.</p>
        </section>
      </div>
    </section>
    <footer><p>Field of view assumes rectilinear geometry at infinity. Distortion, reducer spacing, crop modes, rotation, and stacking software can change the usable stitched field.</p><p><Telescope size={13} /> Start with 20% overlap and add margin for uncertain object boundaries or imperfect pointing.</p></footer>
  </main>;
}
