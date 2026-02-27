"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { actionStockMovementBarcode } from "@/server/actions/stock/action-stock-movement-barcode"
import { toast } from "sonner"
import { Barcode, Camera, CameraOff, CheckCircle, AlertCircle } from "lucide-react"

type ScanResult = {
  success: boolean
  itemName?: string
  reference?: string
  newQuantity?: number
  unit?: string
  error?: string
}

type StockBarcodeScannerProps = {
  siteId: string
}

export function StockBarcodeScanner({ siteId }: StockBarcodeScannerProps) {
  const [mode, setMode] = useState<"manual" | "camera">("manual")
  const [movementType, setMovementType] = useState<"IN" | "OUT">("OUT")
  const [quantity, setQuantity] = useState(1)
  const [manualInput, setManualInput] = useState("")
  const [scanning, setScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [barcodeDetectorAvailable, setBarcodeDetectorAvailable] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetector | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Vérifie si BarcodeDetector est disponible (Chrome/Edge sur tablettes modernes)
    if ("BarcodeDetector" in window) {
      setBarcodeDetectorAvailable(true)
      detectorRef.current = new BarcodeDetector({ formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "data_matrix"] })
    }
    return () => {
      stopCamera()
    }
  }, [])

  const processBarcode = useCallback(async (barcode: string) => {
    if (scanning) return
    setScanning(true)

    const result = await actionStockMovementBarcode({
      siteId,
      barcode: barcode.trim(),
      type: movementType,
      quantity,
    })

    if (result.success && result.data) {
      const { stockItem } = result.data
      setLastResult({
        success: true,
        itemName: stockItem.name,
        reference: stockItem.reference,
        newQuantity: stockItem.newQuantity,
        unit: stockItem.unit,
      })
      toast.success(`${movementType === "OUT" ? "Sortie" : "Entrée"} : ${stockItem.name} → ${stockItem.newQuantity} ${stockItem.unit}`)
    } else if (!result.success) {
      setLastResult({ success: false, error: result.error })
      toast.error(result.error ?? "Article introuvable")
    }

    setScanning(false)
    setManualInput("")
    // Refocus sur l'input pour scanner le suivant
    setTimeout(() => manualInputRef.current?.focus(), 100)
  }, [siteId, movementType, quantity, scanning])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)

      // Scan toutes les 500ms
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !detectorRef.current || scanning) return
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current)
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            await processBarcode(barcodes[0].rawValue)
          }
        } catch { /* ignore */ }
      }, 500)
    } catch {
      toast.error("Impossible d'accéder à la caméra")
    }
  }

  function stopCamera() {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  function handleCameraToggle() {
    if (cameraActive) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (manualInput.trim()) {
      processBarcode(manualInput.trim())
    }
  }

  return (
    <div className="space-y-4">
      {/* Config du mouvement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={movementType} onValueChange={(v) => setMovementType(v as "IN" | "OUT")}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OUT">Sortie (consommation)</SelectItem>
              <SelectItem value="IN">Entrée (réception)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="scanQty">Quantité par scan</Label>
          <Input id="scanQty" type="number" min={1} value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="mt-1" />
        </div>
      </div>

      {/* Mode de saisie */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("manual"); stopCamera() }}
        >
          <Barcode className="w-4 h-4 mr-1" />
          Saisie manuelle / douchette
        </Button>
        {barcodeDetectorAvailable && (
          <Button
            type="button"
            variant={mode === "camera" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("camera")}
          >
            <Camera className="w-4 h-4 mr-1" />
            Caméra
          </Button>
        )}
      </div>

      {/* Mode saisie manuelle / douchette USB */}
      {mode === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <Label htmlFor="barcodeInput">
            Référence / code-barre
            <span className="ml-2 text-xs text-slate-500 font-normal">
              (scannable avec une douchette USB — appuyez sur Entrée ou scannez)
            </span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="barcodeInput"
              ref={manualInputRef}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Scanner ou saisir la référence..."
              autoComplete="off"
              autoFocus
              className="font-mono"
              onKeyDown={(e) => {
                // Les douchettes USB envoient un Enter après le code
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (manualInput.trim()) processBarcode(manualInput.trim())
                }
              }}
            />
            <Button type="submit" disabled={scanning || !manualInput.trim()}>
              {scanning ? "..." : "OK"}
            </Button>
          </div>
        </form>
      )}

      {/* Mode caméra */}
      {mode === "camera" && (
        <div className="space-y-2">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9", maxHeight: "300px" }}>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                Caméra désactivée
              </div>
            )}
            {cameraActive && scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm">
                Traitement...
              </div>
            )}
            {/* Viseur */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-24 border-2 border-white/70 rounded" />
              </div>
            )}
          </div>
          <Button type="button" onClick={handleCameraToggle} variant={cameraActive ? "destructive" : "default"} className="w-full">
            {cameraActive ? (
              <><CameraOff className="w-4 h-4 mr-2" />Arrêter la caméra</>
            ) : (
              <><Camera className="w-4 h-4 mr-2" />Démarrer la caméra</>
            )}
          </Button>
        </div>
      )}

      {/* Dernier résultat */}
      {lastResult && (
        <div className={`rounded-lg p-4 flex items-start gap-3 ${lastResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          {lastResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            {lastResult.success ? (
              <>
                <p className="font-medium text-green-800">{lastResult.itemName}</p>
                <p className="text-green-700">Réf: {lastResult.reference} · Nouveau stock : <strong>{lastResult.newQuantity} {lastResult.unit}</strong></p>
              </>
            ) : (
              <p className="text-red-800">{lastResult.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
