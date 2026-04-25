"use client"
import { useEffect, useState, useCallback } from "react"
import { volunteerAPI, externalAPI, requestAPI } from "@/lib/api"
import { PageSkeleton, ErrorState } from "@/components/page-skeleton"
import { BadgeList } from "@/components/badge-chip"
import { useAuth } from "@/lib/auth-context"
import dynamic from "next/dynamic"

const VolunteerMapView = dynamic(
  () => import("@/components/volunteer-map-view").then(m => ({ default: m.VolunteerMapView })),
  { ssr: false, loading: () => <div className="h-96 shimmer-gradient rounded-2xl" /> }
)

const SKILL_OPTIONS = [
  "all", "medical", "first_aid", "construction", "food_distribution",
  "logistics", "counseling", "driving", "search_rescue", "communication"
]

const SKILL_COLORS: Record<string, string> = {
  medical: "bg-red-100 text-red-700", first_aid: "bg-pink-100 text-pink-700",
  construction: "bg-blue-100 text-blue-700", food_distribution: "bg-orange-100 text-orange-700",
  logistics: "bg-purple-100 text-purple-700", counseling: "bg-green-100 text-green-700",
  driving: "bg-cyan-100 text-cyan-700", rescue: "bg-amber-100 text-amber-700",
  search_rescue: "bg-amber-100 text-amber-700", communication: "bg-indigo-100 text-indigo-700",
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #3b82f6, #8b5cf6)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #ef4444, #dc2626)",
  "linear-gradient(135deg, #6366f1, #4f46e5)",
  "linear-gradient(135deg, #ec4899, #db2777)",
]

type VolunteerItem = {
  id: number; name: string; email: string; skills: string[];
  is_available: boolean; reliability_score: number; tasks_completed: number;
  tasks_rejected: number; badges: string[]; avg_response_time_minutes?: number;
  latitude?: number; longitude?: number
}
type LeaderboardItem = {
  volunteer_id: number; name: string; tasks_completed: number;
  reliability_score: number; badges: string[]; skills: string[];
  avg_response_time_minutes?: number
}

const LIMIT = 20

export default function CoordinatorVolunteersPage() {
  const { user } = useAuth()
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "leaderboard" | "community" | "map">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [skillFilter, setSkillFilter] = useState("all")
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [alerts, setAlerts] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<"list" | "map">("list")

  useEffect(() => { setMounted(true) }, [])

  const fetchVolunteers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await volunteerAPI.getAll({
        is_available: availableOnly || undefined,
        skill: skillFilter === "all" ? undefined : skillFilter,
        limit: LIMIT, offset: page * LIMIT,
      })
      setVolunteers(data.items); setTotal(data.total)
    } catch (e: unknown) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [availableOnly, skillFilter, page])

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try { const data = await volunteerAPI.getLeaderboard(); setLeaderboard(data) }
    catch (e: unknown) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try { const data = await externalAPI.getNDMAAlerts(); setAlerts(data.alerts || []) }
    catch (e: unknown) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === "all") fetchVolunteers()
    else if (activeTab === "leaderboard") fetchLeaderboard()
    else if (activeTab === "community") fetchAlerts()
    else if (activeTab === "map") fetchVolunteers()
  }, [activeTab, fetchVolunteers, fetchLeaderboard, fetchAlerts])

  const handleToggleAvailability = async (id: number, current: boolean) => {
    setVolunteers(prev => prev.map(v => v.id === id ? { ...v, is_available: !current } : v))
    try { await volunteerAPI.toggleAvailability(id, !current) }
    catch { setVolunteers(prev => prev.map(v => v.id === id ? { ...v, is_available: current } : v)) }
  }

  // B5: Import NDMA alert as request
  const handleImportAlert = async (alert: any) => {
    if (!user?.id) return
    try {
      await requestAPI.create(user.id, {
        title: alert.title || "NDMA Alert",
        type: alert.type || "rescue",
        description: alert.description || "",
        urgency: alert.urgency || 4,
        latitude: alert.latitude || 23.0,
        longitude: alert.longitude || 72.5,
        volunteers_needed: 3,
        source: "ndma_feed",
      })
      alert("Imported as request!")
    } catch {}
  }

  return (
    <div className={`p-6 max-w-5xl mx-auto transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header + Tabs */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Volunteers</h1>
          {activeTab === "all" && <p className="text-sm text-gray-400 mt-0.5">{total} total</p>}
        </div>
        <div className="flex items-center gap-3">
          {/* B4: List/Map toggle */}
          {activeTab === "all" && (
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {(["list", "map"] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition-all ${
                    viewMode === m ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}>{m === "list" ? "📋 List" : "🗺️ Map"}</button>
              ))}
            </div>
          )}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(["all", "leaderboard", "community"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  activeTab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}>
                {t === "leaderboard" ? "🏆 Leaderboard" : t === "community" ? "🌐 Community" : "All Volunteers"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-px bg-gray-100 mb-5" />

      {/* All Volunteers Tab */}
      {activeTab === "all" && (
        <>
          <div className="flex gap-3 mb-5 flex-wrap items-center">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={availableOnly}
                onChange={e => { setAvailableOnly(e.target.checked); setPage(0) }}
                className="rounded border-gray-300 text-blue-600" />
              Available only
            </label>
            <select value={skillFilter} onChange={e => { setSkillFilter(e.target.value); setPage(0) }}
              className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SKILL_OPTIONS.map(s => (
                <option key={s} value={s}>{s === "all" ? "All skills" : s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {loading && <PageSkeleton rows={6} />}
          {error && <ErrorState message={error} onRetry={fetchVolunteers} />}

          {!loading && !error && viewMode === "map" && (
            <VolunteerMapView volunteers={volunteers} />
          )}

          {!loading && !error && viewMode === "list" && (
            <>
              <div className="space-y-2">
                {volunteers.map((v, idx) => (
                  <div key={v.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp"
                    style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* C6: Avatar with gradient */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
                        style={{ background: AVATAR_GRADIENTS[v.id % AVATAR_GRADIENTS.length] }}>
                        {v.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm text-gray-900">{v.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                            v.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${v.is_available ? 'bg-green-500 animate-pulse-dot' : 'bg-gray-400'}`} />
                            {v.is_available ? "Available" : "Unavailable"}
                          </span>
                        </div>
                        <div className="flex gap-1 flex-wrap mb-2">
                          {(v.skills || []).map(s => (
                            <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${SKILL_COLORS[s] || 'bg-gray-100 text-gray-600'}`}>
                              {s.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                        {v.badges && v.badges.length > 0 && (
                          <div className="mb-2"><BadgeList badges={v.badges} /></div>
                        )}
                        <div className="flex items-center gap-4">
                          {/* C6: Segmented reliability bar */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className={`w-2.5 h-2 rounded-sm ${
                                  i < Math.round(v.reliability_score * 10) ? 'bg-blue-500' : 'bg-gray-100'
                                }`} />
                              ))}
                            </div>
                            <span className="text-[11px] text-gray-500">{(v.reliability_score * 100).toFixed(0)}%</span>
                          </div>
                          <span className="text-[11px] text-gray-400">{v.tasks_completed} completed</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleToggleAvailability(v.id, v.is_available)}
                      className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all active:scale-95 flex-shrink-0 ${
                        v.is_available ? "border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200" : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}>
                      {v.is_available ? "Mark Unavailable" : "Mark Available"}
                    </button>
                  </div>
                ))}
                {volunteers.length === 0 && (
                  <div className="text-center py-16 animate-fadeInUp">
                    <p className="text-3xl mb-3">👤</p>
                    <p className="text-sm font-medium text-gray-500">No volunteers yet</p>
                    <p className="text-xs text-gray-400 mt-1">Invite your field team to sign up</p>
                  </div>
                )}
              </div>
              {total > LIMIT && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="text-xs px-3 py-2 border border-gray-200 rounded-xl disabled:opacity-40 transition-all active:scale-95">← Prev</button>
                  <span className="text-xs text-gray-500">Page {page + 1} of {Math.ceil(total / LIMIT)}</span>
                  <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)}
                    className="text-xs px-3 py-2 border border-gray-200 rounded-xl disabled:opacity-40 transition-all active:scale-95">Next →</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Leaderboard Tab */}
      {activeTab === "leaderboard" && (
        <>
          {loading && <PageSkeleton rows={10} />}
          {error && <ErrorState message={error} onRetry={fetchLeaderboard} />}
          {!loading && !error && (
            <div className="space-y-2">
              {leaderboard.map((v, i) => (
                <div key={v.volunteer_id}
                  className={`bg-white border rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp ${
                    i === 0 ? 'border-l-4 border-l-amber-400 border-amber-200' :
                    i === 1 ? 'border-l-4 border-l-gray-400 border-gray-200' :
                    i === 2 ? 'border-l-4 border-l-orange-400 border-orange-200' : 'border-gray-100'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <span className={`text-xl font-bold w-8 text-center flex-shrink-0 ${
                    i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-300"
                  }`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
                    style={{ background: AVATAR_GRADIENTS[v.volunteer_id % AVATAR_GRADIENTS.length] }}>
                    {v.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {v.tasks_completed} tasks · {(v.reliability_score * 100).toFixed(0)}% reliability
                    </p>
                    {v.badges && v.badges.length > 0 && <div className="mt-1.5"><BadgeList badges={v.badges} /></div>}
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end max-w-32 flex-shrink-0">
                    {(v.skills || []).map(s => (
                      <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${SKILL_COLORS[s] || 'bg-gray-100 text-gray-600'}`}>
                        {s.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center py-16 text-gray-400 text-sm animate-fadeInUp">
                  <p className="text-3xl mb-3">🏆</p>
                  <p className="text-sm font-medium text-gray-500">No leaderboard data yet</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* B5: Community Feed Tab */}
      {activeTab === "community" && (
        <>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl mb-5 animate-fadeInUp">
            <p className="text-sm text-blue-800 font-medium">🌐 Community Feed</p>
            <p className="text-xs text-blue-600 mt-0.5">These are external listings from NDMA and partner networks, not registered users.</p>
          </div>
          {loading && <PageSkeleton rows={4} />}
          {error && <ErrorState message={error} onRetry={fetchAlerts} />}
          {!loading && !error && (
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div key={i}
                  className="bg-white border border-gray-100 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp"
                  style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">{a.title}</span>
                        <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full font-bold">{a.type || 'alert'}</span>
                        {a.urgency && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">Urgency {a.urgency}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{a.description}</p>
                      {a.latitude && <p className="text-[10px] text-gray-400 mt-1">📍 {a.latitude?.toFixed(2)}, {a.longitude?.toFixed(2)}</p>}
                    </div>
                    <button
                      onClick={() => handleImportAlert(a)}
                      className="text-xs text-white px-3 py-2 rounded-xl font-medium flex-shrink-0 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                      Import as Request
                    </button>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-16 animate-fadeInUp">
                  <p className="text-3xl mb-3">🌐</p>
                  <p className="text-sm font-medium text-gray-500">No community alerts right now</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
