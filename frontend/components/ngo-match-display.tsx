"use client"
import { PageSkeleton } from "@/components/page-skeleton"

interface MatchCandidate {
  volunteer_id: number
  volunteer_name: string
  match_score: number
  reason: string
  distance_km: number
  breakdown?: {
    skill_score?: number
    distance_score?: number
    urgency_bonus?: number
    reliability_score?: number
  }
}

interface Props {
  candidates: MatchCandidate[]
  onAssign: (volunteerName: string) => void
  isLoading: boolean
}

export function NGOMatchDisplay({ candidates, onAssign, isLoading }: Props) {
  if (isLoading) return <PageSkeleton rows={3} />

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8 animate-fadeInUp">
        <p className="text-3xl mb-3">🔍</p>
        <p className="text-sm font-medium text-gray-500">No active volunteers match this request</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting urgency or required skills</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {candidates.map((c, i) => {
        const pct = Math.round(c.match_score * 100)
        const isBest = i === 0

        return (
          <div
            key={c.volunteer_id}
            className={`border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fadeInUp ${
              isBest ? "border-amber-200 bg-amber-50/50 shadow-sm" : "border-gray-100 bg-white"
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{
                    background: isBest
                      ? "linear-gradient(135deg, #f59e0b, #d97706)"
                      : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  }}
                >
                  {c.volunteer_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{c.volunteer_name}</span>
                    {isBest && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold badge-glow-amber">
                        Best Match ✦
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{c.reason}</p>
                </div>
              </div>

              {/* Circular progress ring */}
              <div className="flex-shrink-0 w-14 h-14 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#9ca3af"}
                    strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-900">{pct}%</span>
                </div>
              </div>
            </div>

            {/* Breakdown bars */}
            {c.breakdown && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: "Skill", val: c.breakdown.skill_score || 0, color: "bg-blue-500" },
                  { label: "Dist", val: c.breakdown.distance_score || 0, color: "bg-green-500" },
                  { label: "Urgency", val: c.breakdown.urgency_bonus || 0, color: "bg-orange-500" },
                  { label: "Reliability", val: c.breakdown.reliability_score || 0, color: "bg-purple-500" },
                ].map(b => (
                  <div key={b.label}>
                    <p className="text-[9px] text-gray-400 mb-0.5">{b.label}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${b.color} rounded-full transition-all`} style={{ width: `${Math.min(100, b.val * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                📍 {c.distance_km < 0.1 ? "< 0.1" : c.distance_km.toFixed(1)}km away
              </span>
              <button
                onClick={() => onAssign(c.volunteer_name)}
                className="text-xs text-white px-4 py-2 rounded-xl font-medium transition-all active:scale-95"
                style={{
                  background: isBest
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "linear-gradient(135deg, #3b82f6, #4f46e5)",
                }}
              >
                ✦ Assign
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
