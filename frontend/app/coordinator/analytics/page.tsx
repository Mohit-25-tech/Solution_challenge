"use client"
import { useEffect, useState, useCallback } from "react"
import { analyticsAPI } from "@/lib/api"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts"

type Overview = {
  total_volunteers: number
  active_volunteers: number
  total_requests: number
  completed_requests: number
  pending_requests: number
  fulfillment_rate: number
  avg_match_score: number
  requests_by_day: { date: string; count: number }[]
  top_skills_demand: { skill: string; count: number }[]
}

const BAR_COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899"
]

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await analyticsAPI.getOverview()
      setData(d)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="p-6"><PageSkeleton rows={8} /></div>
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchData} /></div>
  if (!data) return null

  const STAT_CARDS = [
    { label: "Total Volunteers", value: data.total_volunteers, color: "text-blue-600", bg: "bg-blue-50", emoji: "👥" },
    { label: "Active Now", value: data.active_volunteers, color: "text-green-600", bg: "bg-green-50", emoji: "✅" },
    { label: "Total Requests", value: data.total_requests, color: "text-gray-900", bg: "bg-gray-50", emoji: "📋" },
    { label: "Completed", value: data.completed_requests, color: "text-emerald-600", bg: "bg-emerald-50", emoji: "🎯" },
    { label: "Fulfillment Rate", value: `${data.fulfillment_rate}%`, color: "text-indigo-600", bg: "bg-indigo-50", emoji: "📈" },
    {
      label: "Avg Match Score",
      value: `${(data.avg_match_score * 100).toFixed(0)}%`,
      color: "text-purple-600",
      bg: "bg-purple-50",
      emoji: "🎯"
    },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform performance overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STAT_CARDS.map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              </div>
              <span className="text-xl">{c.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Line Chart — Requests over time */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Requests — Last 14 Days</h2>
        {data.requests_by_day.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.requests_by_day} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={d => d.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                labelFormatter={l => `Date: ${l}`}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: "#6366f1" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar Chart — Skill demand */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Demand by Skill Type</h2>
        {data.top_skills_demand.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.top_skills_demand} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="skill"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.top_skills_demand.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
