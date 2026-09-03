"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BookOpen, Database, Search, Sparkles, Telescope } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { formatDeclination, formatRightAscension, targetFamily, targetTypeLabels, type TargetCatalogPayload, type TargetTuple } from "@/lib/targets";

const suggestions = ["M 31", "Orion Nebula", "Pleiades", "Caldwell 14", "NGC 7000"];
const featured = ["m31", "m42", "m45", "m8", "m13", "m27", "m51", "m57", "m81", "m82", "ngc7000", "ic434"];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function searchText(target: TargetTuple) {
  return normalize(`${target[0]} ${target[8]} ${target[9]}`);
}

function inCatalog(target: TargetTuple, catalog: string) {
  if (catalog === "all") return true;
  if (catalog === "ngc" || catalog === "ic") return target[0].toLowerCase().startsWith(`${catalog} `);
  if (catalog === "messier") return target[0].startsWith("Messier ") || /(^|\|)M \d+/.test(target[8]);
  return target[0].startsWith("Caldwell ") || target[8].includes("Caldwell ");
}

function dimensions(target: TargetTuple) {
  if (target[5] === null) return "Not listed";
  return target[6] === null ? `${target[5]}′` : `${target[5]}′ × ${target[6]}′`;
}

function aliases(target: TargetTuple) {
  return target[8].split("|").filter(Boolean);
}

export function TargetCatalog() {
  const [payload, setPayload] = useState<TargetCatalogPayload | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState("all");
  const [family, setFamily] = useState("all");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    fetch("../data/targets.json")
      .then((response) => {
        if (!response.ok) throw new Error("Catalogue unavailable");
        return response.json();
      })
      .then((data: TargetCatalogPayload) => setPayload(data))
      .catch(() => setError("The target catalogue could not be loaded. Refresh the page and try again."));
  }, []);

  const filtered = useMemo(() => {
    if (!payload) return [];
    const needle = normalize(deferredQuery);
    return payload.objects
      .filter((target) => inCatalog(target, catalog))
      .filter((target) => family === "all" || targetFamily(target[1]) === family)
      .filter((target) => !needle || searchText(target).includes(needle))
      .sort((a, b) => {
        if (needle) {
          const aName = normalize(a[0]);
          const bName = normalize(b[0]);
          const aRank = aName === needle ? 0 : aName.startsWith(needle) ? 1 : 2;
          const bRank = bName === needle ? 0 : bName.startsWith(needle) ? 1 : 2;
          return aRank - bRank;
        }
        const aIndex = featured.findIndex((name) => searchText(a).includes(name));
        const bIndex = featured.findIndex((name) => searchText(b).includes(name));
        return (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex);
      });
  }, [payload, deferredQuery, catalog, family]);

  return <main>
    <SiteHeader active="targets" />
    <section className="catalog-shell">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow"><Database size={14} /> Celestial object lookup</p>
          <h1>Find your<br /><em>next target.</em></h1>
        </div>
        <p>Search more than 13,000 real NGC, IC, Messier, and Caldwell objects by catalogue number or common name.</p>
      </div>

      <section className="catalog-controls" aria-label="Target search">
        <label className="catalog-search">
          <Search size={19} />
          <span className="sr-only">Search targets</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try M31, Orion Nebula, NGC 7000…" autoComplete="off" />
          {payload && <small>{payload.objects.length.toLocaleString()} objects</small>}
        </label>
        <div className="catalog-filters">
          <label>Catalogue<select value={catalog} onChange={(event) => setCatalog(event.target.value)}><option value="all">All catalogues</option><option value="messier">Messier</option><option value="caldwell">Caldwell</option><option value="ngc">NGC</option><option value="ic">IC</option></select></label>
          <label>Object type<select value={family} onChange={(event) => setFamily(event.target.value)}><option value="all">All types</option><option value="galaxy">Galaxies</option><option value="nebula">Nebulae</option><option value="cluster">Star clusters</option><option value="planetary">Planetary nebulae</option></select></label>
        </div>
        <div className="catalog-suggestions"><span>Popular searches</span>{suggestions.map((suggestion) => <button key={suggestion} onClick={() => setQuery(suggestion)}>{suggestion}</button>)}</div>
      </section>

      <section className="catalog-results" aria-live="polite">
        <div className="catalog-result-heading">
          <div><p className="eyebrow"><Sparkles size={14} /> Catalogue results</p><h2>{query ? `Matches for “${query}”` : "Field favorites"}</h2></div>
          {payload && <p>{filtered.length.toLocaleString()} matching objects · showing {Math.min(60, filtered.length).toLocaleString()}</p>}
        </div>
        {!payload && !error && <div className="catalog-state"><Telescope size={22} /><p>Loading the night-sky catalogue…</p></div>}
        {error && <div className="catalog-state error"><p>{error}</p></div>}
        {payload && filtered.length === 0 && <div className="catalog-state"><Search size={22} /><p>No matching objects. Try a catalogue number, common name, or broader filter.</p></div>}
        <div className="catalog-grid">
          {filtered.slice(0, 60).map((target) => <article key={`${target[0]}-${target[2]}-${target[3]}`}>
            <div className="catalog-card-top"><span>{targetTypeLabels[target[1]] ?? target[1]}</span><b>{target[4]}</b></div>
            <h3>{target[0]}</h3>
            <p className="catalog-common-name">{target[9] || "No common name listed"}</p>
            {aliases(target).length > 0 && <div className="catalog-aliases">{aliases(target).slice(0, 4).map((alias) => <span key={alias}>{alias}</span>)}</div>}
            <dl>
              <div><dt>RA</dt><dd>{formatRightAscension(target[2])}</dd></div>
              <div><dt>Dec</dt><dd>{formatDeclination(target[3])}</dd></div>
              <div><dt>Size</dt><dd>{dimensions(target)}</dd></div>
              <div><dt>Magnitude</dt><dd>{target[7] === null ? "Not listed" : target[7].toFixed(2)}</dd></div>
            </dl>
          </article>)}
        </div>
      </section>

      <section className="catalog-note"><BookOpen size={19} /><div><b>What the numbers mean</b><p>Coordinates use the J2000 epoch. Angular size is listed in arcminutes; magnitude is the available visual or blue catalogue magnitude and may not describe surface brightness or photographic difficulty.</p></div></section>
    </section>
    <footer>
      <p>Catalogue data from <a href="https://github.com/mattiaverga/OpenNGC" target="_blank" rel="noreferrer">OpenNGC</a>, created by Mattia Verga and contributors, licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>.</p>
      <p>OpenNGC combines positions and object data from NED, SIMBAD/CDS, HyperLEDA, HEASARC, and Harold Corwin’s NGC/IC research.</p>
    </footer>
  </main>;
}
