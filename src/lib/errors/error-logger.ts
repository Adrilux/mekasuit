import { serverEnv } from "@/lib/env/env-server-schema"

type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Vérifie si ce niveau de log doit être émis selon la config
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[serverEnv.LOG_LEVEL]
}

// Logger structuré — JSON en production, lisible en dev
function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    env: serverEnv.APP_ENV,
    ...meta,
  }

  const output = serverEnv.APP_ENV === "production"
    ? JSON.stringify(entry)
    : `[${level.toUpperCase()}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`

  if (level === "error") {
    console.error(output)
  } else if (level === "warn") {
    console.warn(output)
  } else {
    console.log(output)
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
}
