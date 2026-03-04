"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  slug: string
  machineName: string
  baseUrl: string
  size?: number
}

export function MachineQrCode({ slug, machineName, baseUrl, size = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imgSrc, setImgSrc] = useState<string>("")
  const url = `${baseUrl}/m/${slug}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: size, margin: 1 }, () => {
        setImgSrc(canvasRef.current?.toDataURL("image/png") ?? "")
      })
    }
  }, [url, size])

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Affiché à l'écran */}
      <canvas ref={canvasRef} className="rounded border border-slate-200 print:hidden" />
      {/* Affiché uniquement à l'impression (canvas ne s'imprime pas fiablement) */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={`QR code ${machineName}`}
          className="hidden print:block"
          style={{ width: size, height: size }}
        />
      )}
      <p className="text-xs text-slate-400 font-mono break-all text-center max-w-40">{url}</p>
      <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
        <Printer className="w-4 h-4 mr-1" />
        Imprimer
      </Button>
    </div>
  )
}
