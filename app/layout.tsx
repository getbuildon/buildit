import type { Metadata } from "next"
import localFont from "next/font/local"
import { Google_Sans_Flex } from "next/font/google"
import { SupabaseConfigMissing } from "@/components/auth/SupabaseConfigMissing"
import { AuthProvider } from "@/context/AuthContextSupabase"
import { BRAND_NAME } from "@/lib/brand"
import { readPublicSupabaseConfigFromEnv } from "@/lib/auth/publicSupabaseConfig"
import "./globals.css"

const googleSansFlex = Google_Sans_Flex({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-google-sans",
  display: "swap",
})

const recoleta = localFont({
  src: [
    {
      path: "../public/fonts/Recoleta-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/Recoleta-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/Recoleta-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Recoleta-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Recoleta-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Recoleta-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-recoleta",
})

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Seguimiento de obra`,
  description:
    "Plataforma multitenant de seguimiento de obra para desarrolladoras inmobiliarias.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabasePublicConfig = readPublicSupabaseConfigFromEnv()

  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${recoleta.variable} ${googleSansFlex.variable} font-sans antialiased`}
      >
        {supabasePublicConfig ? (
          <AuthProvider supabasePublicConfig={supabasePublicConfig}>
            {children}
          </AuthProvider>
        ) : (
          <SupabaseConfigMissing />
        )}
      </body>
    </html>
  )
}
