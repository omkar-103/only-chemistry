import type { Metadata } from "next";
import { Inter, Outfit, Space_Grotesk } from "next/font/google";
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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://onlychemistry.com"),
  title: {
    default: "Only Chemistry — Premier Chemistry Education Platform",
    template: "%s | Only Chemistry",
  },
  description:
    "Prepare for JEE Main, JEE Advanced, GATE, MHT-CET, IIT JAM, NET, and SET with expert-curated exams, learning videos, and personalized study support. Only Chemistry — OnlyChemistry.com",
  keywords: [
    "Only Chemistry", "OnlyChemistry", "onlychemistry.com",
    "JEE Main", "JEE Advanced", "GATE", "MHT-CET", "IIT JAM", "NET", "SET",
    "chemistry exam", "online exam portal", "chemistry education",
  ],
  authors: [{ name: "Only Chemistry" }],
  creator: "Only Chemistry",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://onlychemistry.com",
    siteName: "Only Chemistry",
    title: "Only Chemistry — Premier Chemistry Education Platform",
    description: "Expert chemistry exam preparation for JEE, GATE, NET and more. OnlyChemistry.com",
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
      <body className={`${inter.variable} ${outfit.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
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
