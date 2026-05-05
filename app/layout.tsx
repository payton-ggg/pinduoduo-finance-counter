import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pinduoduo",
  description: "Pinduoduo - это платформа для продажи товаров на OLX и 拼多多",
  icons: {
    icon: [
      { url: "/icons.svg", type: "image/svg+xml" },
      { url: "/icons.png", type: "image/png" },
    ],
    apple: "/icons.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pinduoduo dashboard" />
        <link rel="apple-touch-icon" href="/icons.png" />
        <link rel="icon" href="/icons.svg" type="image/svg+xml" />
        <link rel="icon" href="/icons.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/icons.png" type="image/png" sizes="16x16" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "green", "modern"]}
        >
          <div className="w-full max-w-full mx-auto px-2 sm:px-4">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
