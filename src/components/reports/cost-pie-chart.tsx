"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const COLORS = [
  "#3b82f6", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
]

type CostRow = {
  machineId: string
  machineName: string
  totalCostCents: number
}

type Props = {
  data: CostRow[]
  totalCostCents: number
}

export function CostPieChart({ data, totalCostCents }: Props) {
  if (!data.length || totalCostCents === 0) return null

  const chartData = data.slice(0, 8).map((row) => ({
    name: row.machineName,
    value: Math.round(row.totalCostCents / 100),
  }))

  // Si plus de 8 machines, regrouper le reste dans "Autres"
  if (data.length > 8) {
    const rest = data.slice(8).reduce((sum, r) => sum + r.totalCostCents, 0)
    if (rest > 0) chartData.push({ name: "Autres", value: Math.round(rest / 100) })
  }

  const customLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx?: number; cy?: number; midAngle?: number
    innerRadius?: number; outerRadius?: number; percent?: number
  }) => {
    if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent) return null
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            labelLine={false}
            label={customLabel}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number | undefined) => [value != null ? `${value.toFixed(2)} €` : "—", "Coût"]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
