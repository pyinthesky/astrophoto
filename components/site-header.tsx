import Link from "next/link";
import { Aperture, Download, Map, MoonStar } from "lucide-react";

export type SiteSection = "exposure" | "planner" | "presets";

export function SiteHeader({ active }: { active: SiteSection }) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Astro NPF home">
        <span className="brand-mark"><MoonStar size={19} /></span>
        <span>Astro <b>NPF</b></span>
      </Link>
      <nav className="main-nav" aria-label="Primary navigation">
        <Link className={active === "exposure" ? "active" : ""} href="/">
          <Aperture size={15} /> Exposure
        </Link>
        <Link className={active === "planner" ? "active" : ""} href="/sky-planner/">
          <Map size={15} /> Sky planner
        </Link>
        <Link className={active === "presets" ? "active" : ""} href="/lightroom-presets/">
          <Download size={15} /> Presets
        </Link>
      </nav>
      <span className="data-stamp"><span className="live-dot" /> Camera data · Sep 2026</span>
    </header>
  );
}
