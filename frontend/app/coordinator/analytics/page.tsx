"use client"
import { useEffect, useState, useCallback } from "react"
import { analyticsAPI } from "@/lib/api"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Area, AreaChart
} from "recharts"

type Overview = {
  total_volunteers: number; active_volunteers: number; total_requests: number;
  completed_requests: number; pending_requests: number; fulfillment_rate: number;
  avg_match_score: number;
  requests_by_day: { date: string; count: number }[];
  top_skills_demand: { skill: string; count: number }[]
}

const BAR_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"]

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await analyticsAPI.getOverview()) }
    catch (e: unknown) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // B8: CSV Export
  const handleExportCSV = () => {
    if (!data) return
    let csv = "Metric,Value\n"
    csv += `Total Volunteers,${data.total_volunteers}\n`
    csv += `Active Volunteers,${data.active_volunteers}\n`
    csv += `Total Requests,${data.total_requests}\n`
    csv += `Completed,${data.completed_requests}\n`
    csv += `Pending,${data.pending_requests}\n`
    csv += `Fulfillment Rate,${data.fulfillment_rate}%\n`
    csv += `Avg Match Score,${(data.avg_match_score * 100).toFixed(0)}%\n`
    csv += "\nDate,Requests\n"
    data.requests_by_day.forEach(r => { csv += `${r.date},${r.count}\n` })
    csv += "\nSkill,Demand\n"
    data.top_skills_demand.forEach(s => { csv += `${s.skill},${s.count}\n` })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `volunteermatch-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6"><PageSkeleton rows={8} /></div>
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchData} /></div>
  if (!data) return null

  const STAT_CARDS = [
    { label: "Total Volunteers", value: data.total_volunteers, color: "text-blue-600", gradient: "from-blue-50 to-blue-100", border: "border-l-blue-500", emoji: "👥" },
    { label: "Active Now", value: data.active_volunteers, color: "text-green-600", gradient: "from-green-50 to-green-100", border: "border-l-green-500", emoji: "✅" },
    { label: "Total Requests", value: data.total_requests, color: "text-gray-900", gradient: "from-gray-50 to-gray-100", border: "border-l-gray-500", emoji: "📋" },
    { label: "Completed", value: data.completed_requests, color: "text-emerald-600", gradient: "from-emerald-50 to-emerald-100", border: "border-l-emerald-500", emoji: "🎯" },
    { label: "Fulfillment", value: `${data.fulfillment_rate}%`, color: "text-indigo-600", gradient: "from-indigo-50 to-indigo-100", border: "border-l-indigo-500", emoji: "📈" },
    { label: "Avg Match", value: `${(data.avg_match_score * 100).toFixed(0)}%`, color: "text-purple-600", gradient: "from-purple-50 to-purple-100", border: "border-l-purple-500", emoji: "🎯" },
  ]

  return (
    <div className={`p-6 max-w-5xl mx-auto space-y-6 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Platform performance overview</p>
        </div>
        <button onClick={handleExportCSV}
          className="flex items-center gap-2 text-xs border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-50 transition-all active:scale-95">
          ⬇ Export CSV
        </button>
      </div>
      <div className="h-px bg-gray-100" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STAT_CARDS.map((c, i) => (
          <div key={c.label}
            className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-4 border border-gray-100 border-l-4 ${c.border} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp`}
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              </div>
              <span className="text-xl">{c.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-blue-500 rounded-full" />
          <h2 className="text-base font-semibold text-gray-800">Requests — Last 14 Days</h2>
        </div>
        {data.requests_by_day.length < 2 && (
          <p className="text-xs text-amber-600 mb-3 bg-amber-50 px-3 py-1.5 rounded-lg inline-block">
            ⚠️ Limited data — run seed.py to spread dates across 14 days
          </p>
        )}
        {data.requests_by_day.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.requests_by_day} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                labelFormatter={l => `Date: ${l}`}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorCount)"
                dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar Chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-purple-500 rounded-full" />
          <h2 className="text-base font-semibold text-gray-800">Demand by Skill Type</h2>
        </div>
        {data.top_skills_demand.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.top_skills_demand} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="skill" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
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
