"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Camera, Database, ExternalLink, Search, Snowflake } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { brands, cameraCategory, cameraMegapixels, cameraPixelPitch, cameraSensorFormat, cameras } from "@/lib/cameras";

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function CameraCatalog() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [variant, setVariant] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const needle = normalized(deferredQuery);
    return cameras
      .filter((camera) => brand === "all" || camera.brand === brand)
      .filter((camera) => category === "all" || cameraCategory(camera) === category)
      .filter((camera) => variant === "all" || (camera.sensorVariant ?? "Color") === variant)
      .filter((camera) => !needle || normalized([
        camera.brand,
        camera.model,
        camera.year,
        cameraCategory(camera),
        cameraSensorFormat(camera),
        camera.sensorVariant ?? "Color",
      ].join(" ")).includes(needle))
      .sort((a, b) => a.brand.localeCompare(b.brand) || b.year - a.year || a.model.localeCompare(b.model));
  }, [brand, category, deferredQuery, variant]);

  return <main>
    <SiteHeader active="cameras" />
    <section className="catalog-shell camera-catalog-shell">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow"><Database size={14} /> Camera and sensor lookup</p>
          <h1>Know your<br /><em>sensor.</em></h1>
        </div>
        <p>Compare the dimensions, resolution, pixel pitch, and sensor format behind the exposure and image-scale calculations.</p>
      </div>

      <section className="catalog-controls" aria-label="Camera search">
        <label className="catalog-search">
          <Search size={19} />
          <span className="sr-only">Search cameras</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Sony, ASI2600, APS-C, monochrome…" autoComplete="off" />
          <small>{cameras.length} profiles</small>
        </label>
        <div className="catalog-filters camera-catalog-filters">
          <label>Brand<select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="all">All brands</option>{brands.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label>Camera type<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All types</option><option>Mirrorless</option><option>DSLR</option><option>Astronomy</option></select></label>
          <label>Sensor output<select value={variant} onChange={(event) => setVariant(event.target.value)}><option value="all">Color + mono</option><option>Color</option><option>Monochrome</option></select></label>
        </div>
      </section>

      <section className="catalog-results" aria-live="polite">
        <div className="catalog-result-heading">
          <div><p className="eyebrow"><Camera size={14} /> Camera results</p><h2>{query ? `Matches for “${query}”` : "All camera profiles"}</h2></div>
          <p>{filtered.length} matching {filtered.length === 1 ? "camera" : "cameras"}</p>
        </div>
        {filtered.length === 0 && <div className="catalog-state"><Search size={22} /><p>No matching cameras. Try a model family, brand, or broader filter.</p></div>}
        <div className="camera-catalog-grid">
          {filtered.map((camera) => {
            const sensorVariant = camera.sensorVariant ?? "Color";
            return <article key={camera.id}>
              <div className="catalog-card-top"><span>{camera.brand}</span><b>{cameraCategory(camera)}</b></div>
              <h3>{camera.model}</h3>
              <div className="camera-badges">
                <span>{cameraSensorFormat(camera)}</span>
                <span>{sensorVariant}</span>
                {camera.cooled && <span><Snowflake size={10} /> Cooled</span>}
              </div>
              <dl>
                <div><dt>Sensor</dt><dd>{camera.sensorWidth.toFixed(camera.sensorWidth < 20 ? 2 : 1)} × {camera.sensorHeight.toFixed(camera.sensorHeight < 20 ? 2 : 1)} mm</dd></div>
                <div><dt>Native image</dt><dd>{camera.imageWidth.toLocaleString()} × {camera.imageHeight.toLocaleString()}</dd></div>
                <div><dt>Resolution</dt><dd>{cameraMegapixels(camera).toFixed(1)} MP</dd></div>
                <div><dt>Pixel pitch</dt><dd>{cameraPixelPitch(camera).toFixed(2)} µm</dd></div>
                <div><dt>Introduced</dt><dd>{camera.year}</dd></div>
                <div><dt>Output</dt><dd>{sensorVariant}</dd></div>
              </dl>
              {camera.sourceUrl && <a className="camera-source-link" href={camera.sourceUrl} target="_blank" rel="noreferrer">Official specifications <ExternalLink size={13} /></a>}
            </article>;
          })}
        </div>
      </section>

      <section className="catalog-note"><Database size={19} /><div><b>How these profiles are used</b><p>Pixel pitch is derived from active sensor width and native image width, then shared by the NPF and advanced calculators. Astronomy-camera dimensions are normalized from the manufacturer pixel count and stated pixel pitch so the computed pitch stays exact.</p></div></section>
    </section>
    <footer>
      <p>Dedicated astronomy-camera specifications link to their manufacturers: ZWO, QHYCCD, and Player One Astronomy.</p>
      <p>Use custom sensor mode in the exposure calculator if your camera is not listed.</p>
    </footer>
  </main>;
}
