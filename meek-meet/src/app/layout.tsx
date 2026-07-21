import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Sans_3, Caveat } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://meekmeet.com"),
  title: "Meek Meet | Blessed Are The Meek",
  description:
    "A warm community of faith where the meek gather, share, and build something beautiful together. Join us under the new moon.",
  openGraph: {
    siteName: "Meek Meet",
    title: "Meek Meet | Blessed Are The Meek",
    description:
      "A warm community of faith where the meek gather, share, and build something beautiful together. Join us under the new moon.",
    type: "website",
    locale: "en_AU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meek Meet | Blessed Are The Meek",
    description:
      "A warm community of faith where the meek gather, share, and build something beautiful together. Join us under the new moon.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${sourceSans.variable} ${caveat.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-cream text-charcoal">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
