import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.GITHUB_ACTIONS ? "/astrophoto" : "";
const siteUrl = "https://pyinthesky.github.io/astrophoto";
const themeBootScript = `try{if(localStorage.getItem("astro-npf-theme")==="night")document.documentElement.dataset.theme="night"}catch{}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NPF Rule Calculator – Astrophotography Exposure Time",
    template: "%s | Astro NPF",
  },
  description: "Calculate the longest exposure for pinpoint stars with the full NPF rule, current camera sensor data, sky position, and a mobile Milky Way planner.",
  applicationName: "Astro NPF",
  alternates: { canonical: `${siteUrl}/` },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/`,
    siteName: "Astro NPF",
    title: "NPF Rule Calculator – Astrophotography Exposure Time",
    description: "Find the longest shutter speed for sharp stars, plan the Milky Way, and download approachable Lightroom presets.",
    images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630, alt: "Astro NPF star-trail exposure calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NPF Rule Calculator – Astrophotography Exposure Time",
    description: "Find the longest shutter speed for sharp stars and plan the Milky Way from your location.",
    images: [`${siteUrl}/og.png`],
  },
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
  },
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Astro NPF",
  url: `${siteUrl}/`,
  applicationCategory: "PhotographyApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser",
  description: "A free NPF rule exposure calculator and night-sky planner for untracked astrophotography.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Full declination-aware NPF rule",
    "Camera sensor and pixel-pitch database",
    "Milky Way and bright-star sky planner",
    "Target-aware astrophotography trip planner with nearby scouting areas",
    "Sun and Moon calendar with twilight and moonless-darkness windows",
    "Searchable Messier, Caldwell, NGC, and IC deep-sky catalogue",
    "On-demand cloud, wind, precipitation, and dew forecast",
    "Field of view, pixel scale, star drift, and integration calculators",
    "Lightroom astrophotography preset downloads",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootScript }} /></head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
