"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { QrCode, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Props = {
  stockItemId: string
  reference: string
  itemName: string
  baseUrl: string
}

function QrCodeCanvas({ url, itemName, reference }: { url: string; itemName: string; reference: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 180, margin: 1 })
    }
  }, [url])

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
          <title>Étiquette — ${reference}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; gap: 0; }
            img { width: 200px; height: 200px; }
            .ref { margin: 6px 0 2px; font-size: 15px; font-weight: 700; font-family: monospace; color: #1e293b; }
            .name { font-size: 12px; color: #475569; text-align: center; max-width: 220px; }
            small { margin-top: 6px; font-size: 9px; color: #94a3b8; word-break: break-all; max-width: 220px; text-align: center; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <p class="ref">${reference}</p>
          <p class="name">${itemName}</p>
          <small>${url}</small>
          <script>window.onload = () => { window.print(); window.close() }<\/script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="rounded border border-slate-200" />
      <div className="text-center">
        <p className="text-sm font-bold font-mono text-slate-800">{reference}</p>
        <p className="text-xs text-slate-500 mt-0.5">{itemName}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-1.5" />
        Imprimer l&apos;étiquette
      </Button>
    </div>
  )
}

export function StockQrCode({ stockItemId, reference, itemName, baseUrl }: Props) {
  const [open, setOpen] = useState(false)
  const url = `${baseUrl}/stock/${stockItemId}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="w-4 h-4 mr-1.5" />
          Étiquette QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Étiquette article</DialogTitle>
        </DialogHeader>
        {open && (
          <QrCodeCanvas url={url} itemName={itemName} reference={reference} />
        )}
      </DialogContent>
    </Dialog>
  )
}
