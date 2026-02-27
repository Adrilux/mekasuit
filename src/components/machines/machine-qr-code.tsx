"use client"

import { useEffect, useRef } from "react"
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
  const url = `${baseUrl}/m/${slug}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: size, margin: 1 })
    }
  }, [url, size])

  function handlePrint() {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code — ${machineName}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            img { width: 200px; height: 200px; }
            p { margin: 8px 0 0; font-size: 14px; text-align: center; color: #334155; }
            small { font-size: 10px; color: #94a3b8; word-break: break-all; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <p><strong>${machineName}</strong></p>
          <small>${url}</small>
          <script>window.onload = () => { window.print(); window.close() }<\/script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded border border-slate-200" />
      <p className="text-xs text-slate-400 font-mono break-all text-center max-w-40">{url}</p>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-1" />
        Imprimer
      </Button>
    </div>
  )
}
