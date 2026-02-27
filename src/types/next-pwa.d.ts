// Déclaration de type pour next-pwa (pas de types officiels @types/next-pwa)
declare module "@ducanh2912/next-pwa" {
  import type { NextConfig } from "next"

  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    fallbacks?: {
      document?: string
      image?: string
      audio?: string
      video?: string
      font?: string
    }
    cacheOnFrontEndNav?: boolean
    reloadOnOnline?: boolean
  }

  function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export default withPWA
}
