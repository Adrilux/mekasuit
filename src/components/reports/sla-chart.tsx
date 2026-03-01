"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { SlaRow } from "@/server/queries/reports/query-get-sla-report"

type Props = {
  data: SlaRow[]
}

export function SlaChart({ data }: Props) {
  const chartData = data
    .filter((row) => row.total > 0)
    .map((row) => ({
      name: row.priorityLabel,
      "Dans les délais": row.withinSla,
      "Hors délais": row.total - row.withinSla,
    }))

  if (!chartData.length) return null

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Dans les délais" fill="#22c55e" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Hors délais" fill="#ef4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
