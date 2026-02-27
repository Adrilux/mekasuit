import type { NextConfig } from "next"
import withPWA from "@ducanh2912/next-pwa"

const nextConfig: NextConfig = {
  // TypeScript strict — le build échoue si des erreurs TS existent
  typescript: {
    ignoreBuildErrors: false,
  },

  // Modules externes exécutés côté serveur uniquement (pas bundlés côté client)
  serverExternalPackages: ["@prisma/client"],

  // Turbopack — config vide pour signaler à Next.js 16 que Turbopack est intentionnel
  // next-pwa génère son service worker en prod via webpack (désactivé en dev)
  turbopack: {},

  // Standalone : génère un serveur Node minimal pour Docker
  output: "standalone",
}

// Configuration PWA — service worker généré automatiquement
const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Désactivé en développement pour éviter les conflits de cache
  disable: process.env.NODE_ENV === "development",
  // Page de fallback hors ligne
  fallbacks: {
    document: "/offline",
  },
})

export default withPWAConfig(nextConfig)
