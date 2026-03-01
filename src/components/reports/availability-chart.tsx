"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts"
import type { AvailabilityRow } from "@/server/queries/reports/query-get-availability"

type Props = {
  data: AvailabilityRow[]
}

function getColor(rate: number) {
  if (rate >= 95) return "#22c55e"
  if (rate >= 80) return "#f59e0b"
  return "#ef4444"
}

export function AvailabilityChart({ data }: Props) {
  const chartData = data
    .slice(0, 10)
    .map((row) => ({
      name: row.machineName.length > 16 ? row.machineName.slice(0, 14) + "…" : row.machineName,
      rate: row.availabilityRate,
    }))

  if (!chartData.length) return null

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(value) => [`${value}%`, "Disponibilité"]} />
          <Bar dataKey="rate" name="Disponibilité" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getColor(entry.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
