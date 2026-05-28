import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SupabaseConfigMissing } from "@/components/auth/SupabaseConfigMissing"
import { AuthProvider } from "@/context/AuthContextSupabase"
import { BRAND_NAME } from "@/lib/brand"
import { readPublicSupabaseConfigFromEnv } from "@/lib/auth/publicSupabaseConfig"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="es" className="dark scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
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
