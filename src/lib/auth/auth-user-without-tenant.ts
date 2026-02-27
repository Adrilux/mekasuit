import { headers } from "next/headers"
import { auth } from "./better-auth-server-config"

// Retourne l'utilisateur Better Auth sans vérifier le tenant
// Utilisé pour détecter l'état "authentifié mais pas encore lié à un tenant"
export async function getAuthUserOnly() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}
