import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Orbitron, Sora } from "next/font/google";
import { SessionProvider } from "@/components/layout/session-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

export const metadata = {
  title: "GPS Spoofing Detection Dashboard",
  description: "Production-grade dashboard for realtime spoofing detection, incident triage, reporting, and fleet operations.",
  metadataBase: new URL(appUrl)
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${orbitron.variable} ${sora.variable}`}>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
