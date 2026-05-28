import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/context/AuthContextSupabase"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Build It — Seguimiento de obra",
  description:
    "Plataforma multitenant de seguimiento de obra para desarrolladoras inmobiliarias.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
