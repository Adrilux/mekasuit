"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Initialise avec l'état réel
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Garder le badge "retour en ligne" quelques secondes
      setTimeout(() => setVisible(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setVisible(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Si online et pas visible, ne rien afficher
  if (isOnline && !visible) return null

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
        isOnline
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      <WifiOff className="w-3 h-3" />
      {isOnline ? "Reconnecté" : "Hors ligne"}
    </div>
  )
}
