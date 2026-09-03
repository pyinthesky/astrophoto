import type { Metadata } from "next";
import { Download, FileArchive, Info, SlidersHorizontal, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const siteUrl = "https://pyinthesky.github.io/astrophoto";
const basePath = process.env.GITHUB_ACTIONS ? "/astrophoto" : "";

export const metadata: Metadata = {
  title: "Free Lightroom Presets for Astrophotography",
  description:
    "Download six free, gentle Lightroom presets for Milky Way, nightscape, star trail, and light-polluted astrophotography RAW files.",
  alternates: { canonical: `${siteUrl}/lightroom-presets/` },
  openGraph: {
    title: "Free Lightroom Presets for Astrophotography",
    description: "Six approachable starting points for casual night-sky photographers.",
    url: `${siteUrl}/lightroom-presets/`,
  },
};

const presets = [
  {
    file: "astro-01-clean-natural.xmp",
    name: "01 · Clean Natural",
    best: "A balanced first edit",
    detail: "Gentle contrast, dehaze, masked sharpening, and moderate noise reduction without an over-processed sky.",
  },
  {
    file: "astro-02-milky-way-pop.xmp",
    name: "02 · Milky Way Pop",
    best: "A clearly visible galactic core",
    detail: "More separation and color in the Milky Way while keeping highlights and star color under control.",
  },
  {
    file: "astro-03-light-pollution-cut.xmp",
    name: "03 · Light Pollution Cut",
    best: "Orange or yellow sky glow",
    detail: "Reduces common warm city-light colors, cools the shadows slightly, and adds moderate haze control.",
  },
  {
    file: "astro-04-warm-galactic-core.xmp",
    name: "04 · Warm Galactic Core",
    best: "Summer Milky Way photographs",
    detail: "A restrained warm color grade for the core with cooler shadows and natural-looking stars.",
  },
  {
    file: "astro-05-star-trails.xmp",
    name: "05 · Star Trails",
    best: "Single or stacked trail frames",
    detail: "Deeper blacks, brighter trails, and crisp local contrast without forcing exposure or white balance.",
  },
  {
    file: "astro-06-nightscape-balance.xmp",
    name: "06 · Nightscape Balance",
    best: "Sky plus foreground scenes",
    detail: "Opens dark foreground detail while maintaining a believable night sky and soft noise treatment.",
  },
];

export default function LightroomPresetsPage() {
  return (
    <main>
      <SiteHeader active="presets" />
      <section className="presets-shell">
        <div className="presets-hero">
          <div>
            <p className="eyebrow"><Sparkles size={14} /> Free Lightroom preset pack</p>
            <h1>A good starting point.<br /><em>Not a magic trick.</em></h1>
          </div>
          <div className="presets-download">
            <p>Six moderate edits made for RAW night-sky images and casual hobbyists. Pick a look, then make it yours.</p>
            <a className="download-primary" href={`${basePath}/presets/astro-npf-lightroom-presets.zip`} download>
              <FileArchive size={19} /> Download all six <span>ZIP · 7 KB</span>
            </a>
          </div>
        </div>

        <section className="preset-principles" aria-label="What the presets change">
          <article><SlidersHorizontal size={20} /><div><b>Useful adjustments only</b><p>Contrast, highlights, shadows, texture, dehaze, color, sharpening, and noise reduction.</p></div></article>
          <article><Info size={20} /><div><b>Your creative controls stay yours</b><p>Exposure, white balance, crop, lens profile, transform, and masks are deliberately untouched.</p></div></article>
        </section>

        <section className="preset-grid" aria-label="Included Lightroom presets">
          {presets.map((preset) => (
            <article className="preset-card" key={preset.file}>
              <div className="preset-number">XMP</div>
              <p>{preset.best}</p>
              <h2>{preset.name}</h2>
              <span>{preset.detail}</span>
              <a href={`${basePath}/presets/${preset.file}`} download>
                <Download size={16} /> Download preset
              </a>
            </article>
          ))}
        </section>

        <section className="install-section">
          <div className="install-copy">
            <p className="eyebrow">Quick setup</p>
            <h2>Install once, then edit normally.</h2>
            <p>These presets work best on RAW files. Apply one after choosing a sensible camera profile, then set exposure and white balance for the actual scene.</p>
          </div>
          <div className="install-steps">
            <article><span>Desktop</span><b>Lightroom</b><p>Choose <strong>File → Import Profiles &amp; Presets</strong>, then select the downloaded ZIP.</p></article>
            <article><span>Desktop</span><b>Lightroom Classic</b><p>In Develop, open the Presets panel, choose <strong>+ → Import Presets</strong>, then select the ZIP.</p></article>
            <article><span>Phone / tablet</span><b>Lightroom mobile</b><p>Unzip the pack first. In Presets, open <strong>Yours → Options → Import Presets</strong> and select the XMP files.</p></article>
          </div>
        </section>
      </section>

      <footer>
        <p>Presets are starting points, not corrections for every camera or sky. Reduce dehaze and sharpening if halos, color noise, or crunchy stars appear.</p>
        <p>Installation references: <a href="https://helpx.adobe.com/lightroom/desktop/kb/faq-install-presets-profiles.html">Lightroom desktop</a> · <a href="https://helpx.adobe.com/lightroom/mobile/work-with-presets/import-and-export-presets.html">Lightroom mobile</a></p>
      </footer>
    </main>
  );
}
