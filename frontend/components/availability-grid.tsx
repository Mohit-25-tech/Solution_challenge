"use client"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const SLOTS = ["morning", "afternoon", "evening"]
const SLOT_LABELS: Record<string, string> = { morning: "🌅 AM", afternoon: "☀️ PM", evening: "🌙 Eve" }

interface Props {
  value: Partial<Record<string, string[]>>
  onChange: (val: Partial<Record<string, string[]>>) => void
}

export function AvailabilityGrid({ value, onChange }: Props) {
  const toggle = (day: string, slot: string) => {
    const current = value[day.toLowerCase()] || []
    const updated = current.includes(slot)
      ? current.filter(s => s !== slot)
      : [...current, slot]

    onChange({
      ...value,
      [day.toLowerCase()]: updated,
    })
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[320px]">
        {/* Header */}
        <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-1 mb-1">
          <div />
          {SLOTS.map(s => (
            <div key={s} className="text-center text-[10px] text-gray-400 font-medium py-1">
              {SLOT_LABELS[s]}
            </div>
          ))}
        </div>

        {/* Rows */}
        {DAYS.map(day => {
          const daySlots = value[day.toLowerCase()] || []
          return (
            <div key={day} className="grid grid-cols-[60px_1fr_1fr_1fr] gap-1 mb-1">
              <div className="flex items-center text-xs font-medium text-gray-500">
                {day}
              </div>
              {SLOTS.map(slot => {
                const active = daySlots.includes(slot)
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggle(day, slot)}
                    className={`h-8 rounded-lg text-[10px] font-medium transition-all duration-150 active:scale-95 ${
                      active
                        ? "text-white shadow-sm"
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100"
                    }`}
                    style={active ? { background: 'linear-gradient(135deg, #3b82f6, #6366f1)' } : {}}
                  >
                    {active ? "✓" : ""}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
