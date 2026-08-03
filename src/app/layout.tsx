import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RHGConsultancyService — Premier Chemistry Education Platform",
    template: "%s | RHGConsultancyService",
  },
  description:
    "Prepare for JEE Main, JEE Advanced, GATE, MHT-CET, CSIR NET, UGC NET, and SET with expert-curated exams, learning videos, and personalized study support.",
  keywords: [
    "JEE Main", "JEE Advanced", "GATE", "MHT-CET", "CSIR NET", "UGC NET", "SET",
    "chemistry exam", "online exam portal", "chemistry education",
  ],
  authors: [{ name: "RHGConsultancyService" }],
  creator: "RHGConsultancyService",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "RHGConsultancyService",
    title: "RHGConsultancyService — Premier Chemistry Education Platform",
    description: "Expert chemistry exam preparation for JEE, GATE, NET and more.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
