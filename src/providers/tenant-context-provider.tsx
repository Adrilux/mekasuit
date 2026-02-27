"use client"

import { createContext, useContext } from "react"
import type { SessionUser } from "@/types/session-types"
import type { ModuleName } from "@/types/module-system-types"

type TenantContextValue = {
  session: SessionUser
  activeModules: Set<ModuleName>
  isModuleActive: (module: ModuleName) => boolean
}

const TenantContext = createContext<TenantContextValue | null>(null)

// Fournit le contexte tenant (session + modules actifs) à toute l'app
// Alimenté côté serveur dans le layout (app)/layout.tsx
export function TenantContextProvider({
  children,
  session,
  activeModules,
}: {
  children: React.ReactNode
  session: SessionUser
  activeModules: Set<ModuleName>
}) {
  return (
    <TenantContext.Provider
      value={{
        session,
        activeModules,
        isModuleActive: (module) => activeModules.has(module),
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

// Hook d'accès au contexte tenant — crash si utilisé hors du provider
export function useTenantContext(): TenantContextValue {
  const context = useContext(TenantContext)

  if (!context) {
    throw new Error("useTenantContext doit être utilisé dans un TenantContextProvider")
  }

  return context
}
