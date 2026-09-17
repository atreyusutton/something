import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "something — Find land nobody else noticed",
  description:
    "An AI-powered land discovery platform for North Idaho. Scout beautiful, buildable parcels in Bonner and Boundary counties.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <Logo />
              <span className="text-foreground">something</span>
              <span className="text-muted-foreground font-normal text-xs hidden sm:inline">
                / north idaho
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/discover">Discover</NavLink>
              <NavLink href="/scouts">Scouts</NavLink>
              <Link
                href="/discover"
                className="ml-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Open the map
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
    >
      {children}
    </Link>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {/* topo-style triangle */}
      <path d="M3 19 L9 8 L13 14 L17 7 L21 19 Z" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-primary" />
      <path d="M5 19 L9 12 L12 16 L17 10 L19 19" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent" opacity="0.7" />
    </svg>
  );
}
