"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LowStockItem } from "@/server/queries/stock/query-get-low-stock-items"

type Props = {
  items: LowStockItem[]
}

export function LowStockTable({ items }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((i) => i.id)))
    }
  }

  const orderUrl = selected.size > 0
    ? `/stock/purchase-orders/new?items=${[...selected].join(",")}`
    : null

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-sm text-blue-800 font-medium">
            {selected.size} article{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={orderUrl!}>
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Commander la sélection
            </Link>
          </Button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === items.length && items.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Article</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Référence</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Stock actuel</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Seuil min.</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Fournisseur(s)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-slate-100 cursor-pointer transition-colors ${
                    selected.has(item.id) ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                  onClick={() => { toggle(item.id) }}
                >
                  <td className="px-4 py-3" onClick={(e) => { e.stopPropagation() }}>
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => { toggle(item.id) }}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/stock/${item.id}`}
                      className="font-medium text-slate-900 hover:underline"
                      onClick={(e) => { e.stopPropagation() }}
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.reference}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-red-600 font-semibold">
                      {item.quantityOnHand} {item.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{item.minimumLevel}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.suppliers.length > 0
                      ? item.suppliers.map((s) => s.name).join(", ")
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
