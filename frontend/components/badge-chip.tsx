"use client"

const BADGE_META: Record<string, { emoji: string; label: string; glow: string }> = {
  first_task: { emoji: "🌱", label: "First Task", glow: "badge-glow-purple" },
  "10_tasks": { emoji: "🔥", label: "10 Tasks", glow: "badge-glow-amber" },
  "50_tasks": { emoji: "⭐", label: "50 Tasks", glow: "badge-glow-amber" },
  top_rated: { emoji: "💎", label: "Top Rated", glow: "badge-glow-purple" },
  rapid_responder: { emoji: "⚡", label: "Rapid Responder", glow: "badge-glow-red" },
  community_leader: { emoji: "🏆", label: "Community Leader", glow: "badge-glow-amber" },
}

export function BadgeChip({ badge }: { badge: string }) {
  const meta = BADGE_META[badge] || { emoji: "🏅", label: badge.replace(/_/g, " "), glow: "" }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium capitalize ${meta.glow}`}>
      <span>{meta.emoji}</span> {meta.label}
    </span>
  )
}

export function BadgeList({ badges }: { badges: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <BadgeChip key={b} badge={b} />
      ))}
    </div>
  )
}
