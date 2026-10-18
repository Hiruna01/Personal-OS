import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Personal OS",
    template: "%s · Personal OS",
  },
  description: "Your private academic workspace.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <MotionProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
