"use client"

const BADGE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  first_task:      { label: "First Mission",     color: "bg-green-100 text-green-800",   emoji: "⭐" },
  "10_tasks":      { label: "10 Missions",        color: "bg-blue-100 text-blue-800",    emoji: "✦" },
  top_rated:       { label: "Top Rated",          color: "bg-amber-100 text-amber-800",  emoji: "◆" },
  rapid_responder: { label: "Rapid Responder",    color: "bg-purple-100 text-purple-800", emoji: "⚡" },
  veteran:         { label: "Veteran",            color: "bg-red-100 text-red-800",      emoji: "🏅" },
}

export function BadgeChip({ badge }: { badge: string }) {
  const config = BADGE_CONFIG[badge]
  if (!config) return null
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}
    >
      <span className="text-[11px]">{config.emoji}</span>
      {config.label}
    </span>
  )
}

export function BadgeList({ badges }: { badges: string[] }) {
  if (!badges || badges.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map(b => (
        <BadgeChip key={b} badge={b} />
      ))}
    </div>
  )
}
