import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { requireSession } from "@/lib/auth/auth-session-helpers"
import { assertSiteAccess } from "@/lib/permissions/permission-checker-server"
import { queryGetMachineDetail } from "@/server/queries/machines/query-get-machine-detail"
import { MachineQrCode } from "@/components/machines/machine-qr-code"
import { MachineStatusBadge } from "@/components/machines/machine-status-badge"

export default async function MachineQrCodePage({
  params,
}: {
  params: Promise<{ machineId: string }>
}) {
  const { machineId } = await params
  const session = await requireSession()
  const machine = await queryGetMachineDetail(session, machineId)

  if (!machine) notFound()
  assertSiteAccess(session.role, session.siteIds, machine.siteId)

  const hdrs = await headers()
  const host = hdrs.get("host") ?? "localhost:3000"
  const proto = hdrs.get("x-forwarded-proto") ?? "http"
  const baseUrl = `${proto}://${host}`

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Barre de navigation — masquée à l'impression */}
      <div className="print:hidden flex items-center gap-3 px-6 py-4 border-b border-slate-200">
        <Link
          href={`/machines/${machineId}`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la machine
        </Link>
      </div>

      {/* Contenu centré — imprimable */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full">
          {/* Infos machine */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">{machine.name}</h1>
            {machine.category && (
              <p className="text-slate-500 mt-1">{machine.category}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-sm text-slate-500">{machine.site.name}</span>
              <MachineStatusBadge status={machine.status} />
            </div>
            {machine.serialNumber && (
              <p className="text-xs text-slate-400 mt-1 font-mono">S/N : {machine.serialNumber}</p>
            )}
          </div>

          {/* QR Code agrandi */}
          <MachineQrCode
            slug={machine.qrCodeSlug}
            machineName={machine.name}
            baseUrl={baseUrl}
            size={240}
          />

          {/* Instructions */}
          <p className="text-xs text-slate-400 text-center print:hidden">
            Scannez ce QR code depuis le terrain pour accéder directement à la fiche machine.
          </p>
        </div>
      </div>
    </div>
  )
}
