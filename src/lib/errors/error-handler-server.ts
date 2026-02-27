import { serverEnv } from "@/lib/env/env-server-schema"
import { logger } from "./error-logger"
import {
  AppError,
  AuthError,
  PermissionError,
  ModuleError,
  LicenseError,
  NotFoundError,
  ValidationError,
} from "./app-error-classes"

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }

// Retourne un résultat standardisé pour les Server Actions
// En production, les détails internes ne sont jamais exposés
export function handleServerActionError(error: unknown): { success: false; error: string; code: string } {
  logger.error("Server Action error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })

  if (error instanceof AuthError) {
    return { success: false, error: error.message, code: error.code }
  }

  if (error instanceof PermissionError) {
    return { success: false, error: error.message, code: error.code }
  }

  if (error instanceof ModuleError) {
    return { success: false, error: error.message, code: error.code }
  }

  if (error instanceof LicenseError) {
    return { success: false, error: error.message, code: error.code }
  }

  if (error instanceof NotFoundError) {
    return { success: false, error: error.message, code: error.code }
  }

  if (error instanceof ValidationError) {
    return { success: false, error: error.message, code: error.code }
  }

  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code }
  }

  // Erreur inattendue — ne jamais exposer les détails en production
  const isDevMode = serverEnv.APP_ENV !== "production"

  return {
    success: false,
    error: isDevMode
      ? `Erreur interne : ${error instanceof Error ? error.message : String(error)}`
      : "Une erreur interne est survenue",
    code: "INTERNAL_ERROR",
  }
}

// Helper pour créer un résultat de succès typé
export function success<T>(data: T): { success: true; data: T } {
  return { success: true, data }
}
