import { auth } from "@/lib/auth/better-auth-server-config"
import { toNextJsHandler } from "better-auth/next-js"

// Route handler Better Auth — catch-all pour toutes les routes d'auth
// GET /api/auth/session, POST /api/auth/sign-in, etc.
export const { GET, POST } = toNextJsHandler(auth)
