import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { AuthModal } from "@/components/auth/auth-modal"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { PageTransition } from "@/components/layout/page-transition"
import { FloatingOrbs } from "@/components/effects/floating-orbs"
import { FloatingDock } from "@/components/chat/floating-dock"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "DiamondEarn — Premium Digital Rewards",
  description:
    "PS5-inspired rewards arena. Browse offers as a guest, sign in to claim, level up, and cash out for PayPal, Razer Gold, Steam, and more.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning on <html>/<body> avoids spurious mismatches caused
    // by browser translation extensions (e.g. Google Translate flipping lang="en"
    // to lang="ar" and rewriting text nodes before React hydrates).
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} bg-background`}
    >
      <body suppressHydrationWarning className="font-sans antialiased min-h-dvh">
        {/* PS5 ambient floating orbs — fixed, behind everything else. */}
        <FloatingOrbs />
        <AuthProvider>
          <div className="flex min-h-dvh">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <MobileNav />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-5 md:px-8 md:pb-10 md:pt-8">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>
          <AuthModal />
          {/* Global chat + AI DiamondBot, mounted once site-wide. */}
          <FloatingDock />
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "glass-strong !bg-card/80 !text-foreground !border-white/10 !rounded-xl !shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]",
                title: "!text-foreground !font-medium",
                description: "!text-muted-foreground",
              },
            }}
          />
        </AuthProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
