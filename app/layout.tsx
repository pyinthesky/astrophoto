import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.GITHUB_ACTIONS ? "/astrophoto" : "";

export const metadata: Metadata = {
  title: "Astro NPF — Star Trail Exposure Calculator",
  description: "Calculate the longest untracked exposure for sharp stars using the full NPF rule, current camera sensor profiles, and a declination-aware frame map.",
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
