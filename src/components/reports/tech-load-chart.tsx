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

type TechLoadRow = {
  userId: string
  total: number
  open: number
  closed: number
  corrective: number
  preventive: number
  critical: number
}

type Props = {
  data: TechLoadRow[]
  techNames: Record<string, string>
}

export function TechLoadChart({ data, techNames }: Props) {
  const chartData = data
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((row) => ({
      name: techNames[row.userId] ?? row.userId.slice(0, 8) + "…",
      Ouvertes: row.open,
      Fermées: row.closed,
      Critiques: row.critical,
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
          <Bar dataKey="Ouvertes" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Fermées" fill="#22c55e" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Critiques" fill="#ef4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
