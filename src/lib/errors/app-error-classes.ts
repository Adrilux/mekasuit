// Classes d'erreur typées — permettent une gestion précise et des messages cohérents

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = "AppError"
  }
}

// Erreur d'authentification / session
export class AuthError extends AppError {
  constructor(message = "Non authentifié", context?: Record<string, unknown>) {
    super(message, "AUTH_ERROR", context)
    this.name = "AuthError"
  }
}

// Erreur de permission / rôle insuffisant
export class PermissionError extends AppError {
  constructor(message = "Permission refusée", context?: Record<string, unknown>) {
    super(message, "PERMISSION_ERROR", context)
    this.name = "PermissionError"
  }
}

// Module désactivé pour ce tenant
export class ModuleError extends AppError {
  constructor(moduleName: string) {
    super(`Le module "${moduleName}" n'est pas activé`, "MODULE_INACTIVE", { moduleName })
    this.name = "ModuleError"
  }
}

// Limite de licence atteinte (sites, users)
export class LicenseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "LICENSE_LIMIT_REACHED", context)
    this.name = "LicenseError"
  }
}

// Ressource non trouvée
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource} introuvable${id ? ` (id: ${id})` : ""}`, "NOT_FOUND", {
      resource,
      id,
    })
    this.name = "NotFoundError"
  }
}

// Input invalide (complément à Zod pour les cas métier)
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", context)
    this.name = "ValidationError"
  }
}
