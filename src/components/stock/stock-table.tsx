"use client"

import { useRouter } from "next/navigation"
import { AlertTriangle, Package } from "lucide-react"

type StockItem = {
  id: string
  reference: string
  name: string
  quantityOnHand: number
  minimumLevel: number
  unit: string
  unitCostCents: number
  imageUrl: string | null
}

export function StockTable({ items }: { items: StockItem[] }) {
  const router = useRouter()

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-12 px-3 py-3" />
              <th className="text-left px-4 py-3 font-medium text-slate-600">Référence</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Désignation</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Seuil</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Coût unit.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.quantityOnHand <= item.minimumLevel && item.minimumLevel > 0
              return (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/stock/${item.id}`)}
                >
                  <td className="px-3 py-2">
                    <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.reference}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${isLow ? "text-amber-600" : "text-slate-900"}`}>
                      {item.quantityOnHand}
                    </span>
                    <span className="text-slate-400 ml-1 text-xs">{item.unit}</span>
                    {isLow && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.minimumLevel} {item.unit}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.unitCostCents > 0 ? `${(item.unitCostCents / 100).toFixed(2)} €` : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
