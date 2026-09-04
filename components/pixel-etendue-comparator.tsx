"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Calculator, Info, Telescope } from "lucide-react";
import { comparePixelEtendue, scaleFromPixelAndFocalLength } from "@/lib/pixel-etendue";

type ScaleMode = "direct" | "derive";

type SetupState = {
  apertureMm: number;
  obstructionMm: number;
  lossPercent: number;
  scaleMode: ScaleMode;
  pixelScaleArcsec: number;
  pixelSizeMicrons: number;
  focalLengthMm: number;
};

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

function scaleFor(setup: SetupState) {
  if (setup.scaleMode === "direct") return setup.pixelScaleArcsec;
  return scaleFromPixelAndFocalLength(setup.pixelSizeMicrons, setup.focalLengthMm) ?? 0;
}

function SetupPanel({ name, setup, onChange }: {
  name: "A" | "B";
  setup: SetupState;
  onChange: (setup: SetupState) => void;
}) {
  const update = (patch: Partial<SetupState>) => onChange({ ...setup, ...patch });
  const scale = scaleFor(setup);

  return (
    <fieldset className="etendue-setup">
      <legend><span>Setup {name}</span><b>{scale > 0 ? `${scale.toFixed(2)}″ / pixel` : "Check inputs"}</b></legend>
      <div className="etendue-optics-grid">
        <NumberField id={`etendue-${name}-aperture`} label="Aperture diameter" value={setup.apertureMm}
          onChange={(value) => update({ apertureMm: value })} suffix="mm" min={0.1} max={2_000} step={0.1} />
        <NumberField id={`etendue-${name}-obstruction`} label="Central obstruction" value={setup.obstructionMm}
          onChange={(value) => update({ obstructionMm: value })} suffix="mm" min={0} max={1_999} step={0.1} />
        <NumberField id={`etendue-${name}-loss`} label="Mask / throughput loss" value={setup.lossPercent}
          onChange={(value) => update({ lossPercent: value })} suffix="%" min={0} max={99} step={0.1} />
      </div>

      <div className="etendue-scale-heading"><span>Pixel scale</span><small>Enter it directly or derive it from sensor and focal length.</small></div>
      <div className="mode-tabs etendue-scale-tabs" aria-label={`Setup ${name} pixel scale method`}>
        <button type="button" className={setup.scaleMode === "direct" ? "active" : ""}
          aria-pressed={setup.scaleMode === "direct"} onClick={() => update({ scaleMode: "direct" })}>Direct scale</button>
        <button type="button" className={setup.scaleMode === "derive" ? "active" : ""}
          aria-pressed={setup.scaleMode === "derive"} onClick={() => update({ scaleMode: "derive" })}>Pixel + focal length</button>
      </div>
      {setup.scaleMode === "direct" ? (
        <NumberField id={`etendue-${name}-scale`} label="Image scale" value={setup.pixelScaleArcsec}
          onChange={(value) => update({ pixelScaleArcsec: value })} suffix="arcsec/px" min={0.01} max={100} step={0.01} />
      ) : (
        <div className="tool-input-grid">
          <NumberField id={`etendue-${name}-pixel`} label="Pixel pitch" value={setup.pixelSizeMicrons}
            onChange={(value) => update({ pixelSizeMicrons: value })} suffix="µm" min={0.1} max={100} step={0.01} />
          <NumberField id={`etendue-${name}-focal`} label="Focal length" value={setup.focalLengthMm}
            onChange={(value) => update({ focalLengthMm: value })} suffix="mm" min={1} max={20_000} step={1} />
        </div>
      )}
    </fieldset>
  );
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} sec`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)} min`;
  return `${(seconds / 3_600).toFixed(2)} hr`;
}

function advantageText(ratio: number) {
  if (Math.abs(ratio - 1) < 0.005) return "The setups gather essentially the same sky-limited signal per pixel.";
  if (ratio > 1) return `Setup A gathers ${ratio.toFixed(2)}× as much sky-limited signal per pixel as Setup B.`;
  return `Setup B gathers ${(1 / ratio).toFixed(2)}× as much sky-limited signal per pixel as Setup A.`;
}

export function PixelEtendueComparator({ sharedPixelPitch, sharedFocalLength, sharedCameraName }: {
  sharedPixelPitch: number;
  sharedFocalLength: number;
  sharedCameraName: string;
}) {
  const [setupA, setSetupA] = useState<SetupState>({
    apertureMm: 103, obstructionMm: 0, lossPercent: 0, scaleMode: "direct",
    pixelScaleArcsec: 2.3, pixelSizeMicrons: 3.76, focalLengthMm: 336,
  });
  const [setupB, setSetupB] = useState<SetupState>({
    apertureMm: 150, obstructionMm: 20, lossPercent: 3, scaleMode: "direct",
    pixelScaleArcsec: 2.5, pixelSizeMicrons: 3.76, focalLengthMm: 310,
  });
  const [referenceExposure, setReferenceExposure] = useState(60);

  const result = useMemo(() => comparePixelEtendue(
    { ...setupA, pixelScaleArcsec: scaleFor(setupA) },
    { ...setupB, pixelScaleArcsec: scaleFor(setupB) },
    referenceExposure,
  ), [setupA, setupB, referenceExposure]);

  const swap = () => {
    setSetupA(setupB);
    setSetupB(setupA);
  };

  const loadSharedScale = () => setSetupA({
    ...setupA,
    scaleMode: "derive",
    pixelSizeMicrons: Number(sharedPixelPitch.toFixed(3)),
    focalLengthMm: sharedFocalLength,
  });

  return (
    <section className="etendue-card" aria-labelledby="etendue-title">
      <div className="etendue-heading">
        <div className="tool-title"><Calculator size={21} /><div><span>05 · Setup comparison</span><h2 id="etendue-title">Pixel Étendue &amp; SNR</h2></div></div>
        <div className="etendue-actions">
          <button type="button" onClick={loadSharedScale}>Use {sharedCameraName} scale in A</button>
          <button type="button" onClick={swap}><ArrowLeftRight size={14} /> Swap A / B</button>
        </div>
      </div>
      <p className="etendue-intro">Compare how quickly two optical setups collect light into each pixel for an extended target under sky-background-limited conditions.</p>

      <div className="etendue-setups">
        <SetupPanel name="A" setup={setupA} onChange={setSetupA} />
        <SetupPanel name="B" setup={setupB} onChange={setSetupB} />
      </div>

      <div className="etendue-comparison">
        <div className="etendue-reference">
          <NumberField id="etendue-reference-exposure" label="Reference exposure for Setup A" value={referenceExposure}
            onChange={setReferenceExposure} suffix="sec" min={0.1} max={86_400} step={1} />
          <p><Telescope size={15} /> Exposure equivalence assumes the same target, sky brightness, filter, and sky-limited sub-exposures.</p>
        </div>

        {result ? (
          <div className="etendue-results" aria-live="polite">
            <div className="etendue-verdict"><span>Practical result</span><strong>{advantageText(result.lightRatioAtoB)}</strong></div>
            <div className="etendue-result-grid">
              <span><small>Light / pixel · A ÷ B</small><strong>{result.lightRatioAtoB.toFixed(3)}×</strong></span>
              <span><small>Equal-time SNR · A ÷ B</small><strong>{result.snrRatioAtoB.toFixed(3)}×</strong></span>
              <span><small>When A is {formatDuration(referenceExposure)}</small><strong>B needs {formatDuration(result.exposureBSeconds)}</strong></span>
            </div>
            <details>
              <summary>Show calculation details</summary>
              <p>G ∝ (d² − o²) × (1 − loss) × s². A: {result.setupA.collectingFactor.toFixed(0)} × {scaleFor(setupA).toFixed(2)}². B: {result.setupB.collectingFactor.toFixed(0)} × {scaleFor(setupB).toFixed(2)}².</p>
            </details>
          </div>
        ) : (
          <div className="etendue-error"><Info size={17} /><p>Check that apertures, scales, and exposure are above zero; each obstruction must be smaller than its aperture and loss must stay below 100%.</p></div>
        )}
      </div>

      <p className="etendue-caveat"><Info size={15} /> This is a relative, sky-limited comparison—not a full camera noise model. Quantum efficiency, read noise, seeing, filters, point-source concentration, and final resolution can change real-world results. Coarser sampling can raise per-pixel signal without preserving the same detail.</p>
    </section>
  );
}
