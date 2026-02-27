"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Wrench } from "lucide-react"

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "shadow-none border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors group-hover:bg-blue-700">
            <Wrench className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            GMAO <span className="text-blue-600">Pro</span>
          </span>
        </Link>

        {/* Nav actions */}
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            Se connecter
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Demander une démo
          </Link>
        </nav>
      </div>
    </header>
  )
}
