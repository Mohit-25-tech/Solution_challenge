"use client"
import { useEffect, useState, useCallback } from "react"
import { volunteerAPI, analyticsAPI } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { AvailabilityGrid } from "@/components/availability-grid"
import { BadgeList } from "@/components/badge-chip"
import { PageSkeleton } from "@/components/page-skeleton"

type HistoryItem = { assignment_id: number; request_title: string; request_type: string; match_score: number; status: string; assigned_at: string; completed_at?: string }
type Stats = { tasks_completed: number; acceptance_rate: number; avg_response_time_minutes?: number; badges: string[] }
type VolunteerData = { skills: string[]; is_available: boolean; reliability_score: number; bio?: string; phone?: string; badges?: string[]; availability_slots?: Record<string, string[]> }

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800", accepted: "bg-blue-100 text-blue-800",
  assigned: "bg-yellow-100 text-yellow-800", rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
}

const SKILL_COLORS: Record<string, string> = {
  medical: "bg-red-100 text-red-700", first_aid: "bg-pink-100 text-pink-700",
  construction: "bg-blue-100 text-blue-700", food_distribution: "bg-orange-100 text-orange-700",
  logistics: "bg-purple-100 text-purple-700", counseling: "bg-green-100 text-green-700",
  driving: "bg-cyan-100 text-cyan-700", rescue: "bg-amber-100 text-amber-700",
}

export default function VolunteerProfilePage() {
  const { user, updateSessionUser } = useAuth()
  const [volunteer, setVolunteer] = useState<VolunteerData | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [slots, setSlots] = useState<Partial<Record<string, string[]>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "history">("profile")
  const [mounted, setMounted] = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [onboardData, setOnboardData] = useState({ bio: "", phone: "", skills: "medical, logistics" })

  useEffect(() => { setMounted(true) }, [])

  const load = useCallback(async () => {
    const volunteerId = user?.volunteer_id
    if (!volunteerId) { setLoading(false); return }
    setLoading(true)
    try {
      const [vol, stat, hist] = await Promise.all([
        volunteerAPI.getById(volunteerId),
        analyticsAPI.getVolunteerStats(volunteerId),
        volunteerAPI.getHistory(volunteerId),
      ])
      setVolunteer(vol); setStats(stat); setHistory(hist)
      setSlots(vol.availability_slots || {})
    } finally { setLoading(false) }
  }, [user?.volunteer_id])

  useEffect(() => { load() }, [load])

  const handleSaveProfile = async () => {
    if (!user?.volunteer_id) return
    setSaving(true)
    try {
      await volunteerAPI.update(user.volunteer_id, { availability_slots: slots })
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  const handleToggleAvailable = async () => {
    if (!user?.volunteer_id || !volunteer) return
    const newVal = !volunteer.is_available
    setVolunteer({ ...volunteer, is_available: newVal })
    try { await volunteerAPI.toggleAvailability(user.volunteer_id, newVal) }
    catch { setVolunteer({ ...volunteer, is_available: !newVal }) }
  }

  // B2: Service certificate
  const handleDownloadCertificate = () => {
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(`
      <!DOCTYPE html>
      <html><head><title>VolunteerMatch — Service Certificate</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; text-align: center; padding: 60px 40px; background: #fff; }
        h1 { font-size: 36px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
        .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 48px; }
        .name { font-size: 32px; font-weight: 700; color: #111827; margin: 32px 0 16px; }
        .tasks { font-size: 20px; color: #3b82f6; font-weight: 600; }
        .badges { display: flex; gap: 12px; justify-content: center; margin: 24px 0; flex-wrap: wrap; }
        .badge { background: #f3f4f6; padding: 6px 16px; border-radius: 20px; font-size: 13px; color: #374151; }
        .divider { width: 100px; height: 3px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); margin: 32px auto; border-radius: 4px; }
        .date { color: #9ca3af; font-size: 12px; margin-top: 40px; }
        .reliability { font-size: 16px; color: #374151; margin-top: 8px; }
        @media print { body { padding: 40px 30px; } }
      </style></head><body>
        <h1>VolunteerMatch</h1>
        <p class="subtitle">Certificate of Volunteer Service</p>
        <div class="divider"></div>
        <p style="color:#6b7280; font-size: 16px;">This is to certify that</p>
        <p class="name">${user?.name || 'Volunteer'}</p>
        <p style="color:#6b7280;">has successfully contributed to disaster relief operations</p>
        <p class="tasks">${stats?.tasks_completed || 0} Tasks Completed</p>
        <p class="reliability">Reliability Score: ${volunteer ? (volunteer.reliability_score * 100).toFixed(0) : 0}%</p>
        ${volunteer?.badges && volunteer.badges.length > 0 ? `
          <div class="badges">${volunteer.badges.map(b => `<span class="badge">🏅 ${b.replace(/_/g, ' ')}</span>`).join('')}</div>
        ` : ''}
        <div class="divider"></div>
        <p class="date">Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p class="date">VolunteerMatch Platform — Powered by Google Solution Challenge</p>
        <script>setTimeout(() => window.print(), 500)</script>
      </body></html>
    `)
    w.document.close()
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setCreatingProfile(true)
    try {
      const skillsArray = onboardData.skills.split(",").map(s => s.trim().toLowerCase()).filter(s => s)
      const res: any = await volunteerAPI.create(user.id, {
        bio: onboardData.bio, phone: onboardData.phone, skills: skillsArray,
        is_available: true, latitude: 28.6139, longitude: 77.2090
      })
      if (res.id) { updateSessionUser({ ...user, volunteer_id: res.id }) }
    } catch (e: unknown) { alert((e as Error).message || "Failed to create profile") }
    finally { setCreatingProfile(false) }
  }

  if (!user?.volunteer_id && !loading) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-white border border-gray-100 rounded-2xl shadow-sm animate-fadeInUp">
        <div className="text-center mb-6">
          <p className="text-3xl mb-3">👋</p>
          <h2 className="text-lg font-bold text-gray-900">Welcome to VolunteerMatch</h2>
          <p className="text-sm text-gray-500 mt-1">Let's set up your profile so NGOs can find you.</p>
        </div>
        <form onSubmit={handleCreateProfile} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Phone Number</label>
            <input type="text" required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+91 9876 543 210" value={onboardData.phone} onChange={e => setOnboardData({...onboardData, phone: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Primary Skills (comma separated)</label>
            <input type="text" required className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="medical, rescue, cooking..." value={onboardData.skills} onChange={e => setOnboardData({...onboardData, skills: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Short Bio</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Tell us about your experience..." value={onboardData.bio} onChange={e => setOnboardData({...onboardData, bio: e.target.value})} />
          </div>
          <button type="submit" disabled={creatingProfile}
            className="w-full text-white font-medium text-sm py-2.5 rounded-xl disabled:opacity-50 mt-4 transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
            {creatingProfile ? "Creating..." : "Create My Profile"}
          </button>
        </form>
      </div>
    )
  }

  if (loading) return <div className="p-6"><PageSkeleton rows={6} /></div>
  if (!volunteer) return null

  return (
    <div className={`p-6 max-w-2xl mx-auto space-y-5 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* C10: Hero card with gradient background */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3b82f6, #4f46e5, #6366f1)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
              {(user?.name || 'V').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{user?.name}</h1>
              <p className="text-sm text-white/60">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleToggleAvailable}
              className={`text-xs px-4 py-2 rounded-xl font-medium transition-all active:scale-95 ${
                volunteer.is_available ? "bg-green-500/30 text-green-100 border border-green-400/30" : "bg-white/10 text-white/60 border border-white/20"
              }`}>
              {volunteer.is_available ? "● Available" : "○ Unavailable"}
            </button>
            {/* B2: Certificate download */}
            <button onClick={handleDownloadCertificate}
              className="text-xs px-4 py-2 rounded-xl font-medium bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 transition-all active:scale-95">
              📜 Certificate
            </button>
          </div>
        </div>
      </div>

      {/* Badges */}
      {volunteer.badges && volunteer.badges.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-4 animate-fadeInUp">
          <p className="text-xs font-medium text-gray-500 mb-3">🏅 Badges Earned</p>
          <BadgeList badges={volunteer.badges} />
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Tasks done", value: stats.tasks_completed, emoji: "✅", gradient: "from-emerald-50 to-emerald-100", color: "text-emerald-700" },
            { label: "Acceptance", value: `${stats.acceptance_rate}%`, emoji: "📊", gradient: "from-blue-50 to-blue-100", color: "text-blue-700" },
            { label: "Avg response", value: stats.avg_response_time_minutes ? `${stats.avg_response_time_minutes.toFixed(1)}m` : "—", emoji: "⚡", gradient: "from-amber-50 to-amber-100", color: "text-amber-700" },
          ].map((c, i) => (
            <div key={c.label} className={`bg-gradient-to-br ${c.gradient} border border-gray-100 rounded-2xl p-4 text-center animate-fadeInUp`}
              style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-lg mb-1">{c.emoji}</div>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["profile", "history"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 text-xs rounded-lg font-medium capitalize transition-all ${
              activeTab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
            }`}>
            {t === "history" ? `History (${history.length})` : "Profile"}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5 shadow-sm animate-fadeInUp">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {(volunteer.skills || []).map(s => (
                <span key={s} className={`text-xs px-3 py-1 rounded-full capitalize font-medium ${SKILL_COLORS[s] || 'bg-gray-100 text-gray-600'}`}>
                  {s.replace(/_/g, " ")}
                </span>
              ))}
              {(volunteer.skills || []).length === 0 && <span className="text-xs text-gray-400">No skills listed</span>}
            </div>
          </div>

          {/* Segmented reliability bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-medium text-gray-500">Reliability Score</p>
              <span className="text-xs font-bold text-gray-700">{(volunteer.reliability_score * 100).toFixed(0)}%</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`flex-1 h-2.5 rounded-sm ${
                  i < Math.round(volunteer.reliability_score * 10) ? 'bg-blue-500' : 'bg-gray-100'
                }`} />
              ))}
            </div>
          </div>

          {/* Availability Grid */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3">Weekly Availability</p>
            <AvailabilityGrid value={slots} onChange={setSlots} />
          </div>

          <button onClick={handleSaveProfile} disabled={saving}
            className={`w-full text-sm py-2.5 rounded-xl font-medium transition-all active:scale-95 ${
              saved ? "bg-green-50 text-green-700 border border-green-200" : "text-white disabled:opacity-60"
            }`}
            style={saved ? {} : { background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
            {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {history.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm animate-fadeInUp">
              <p className="text-3xl mb-3">📭</p>
              <p className="font-medium text-gray-500">No task history yet</p>
              <p className="text-xs text-gray-400 mt-1">Start claiming tasks to build your history</p>
            </div>
          )}
          {/* C10: Timeline history */}
          {history.map((h, idx) => (
            <div key={h.assignment_id}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp"
              style={{ animationDelay: `${idx * 50}ms` }}>
              {/* Timeline dot */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${
                  h.status === 'completed' ? 'bg-green-500' : h.status === 'accepted' ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                {idx < history.length - 1 && <div className="w-0.5 h-6 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{h.request_title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="capitalize">{h.request_type.replace(/_/g, " ")}</span>
                  {" · "}Score {(h.match_score * 100).toFixed(0)}%
                  {" · "}{new Date(h.assigned_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[h.status] || "bg-gray-100 text-gray-500"}`}>
                {h.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
