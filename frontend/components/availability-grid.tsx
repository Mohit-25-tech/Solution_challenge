"use client"

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const SLOTS = ["morning", "afternoon", "evening"] as const
const SLOT_LABELS = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" }
const SLOT_TIMES = { morning: "6–12am", afternoon: "12–6pm", evening: "6–11pm" }

type AvailabilitySlots = Partial<Record<string, string[]>>

export function AvailabilityGrid({
  value,
  onChange,
  disabled = false,
}: {
  value: AvailabilitySlots
  onChange: (v: AvailabilitySlots) => void
  disabled?: boolean
}) {
  const toggle = (day: string, slot: string) => {
    if (disabled) return
    const current = value[day] || []
    const updated = current.includes(slot)
      ? current.filter(s => s !== slot)
      : [...current, slot]
    onChange({ ...value, [day]: updated })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse select-none">
        <thead>
          <tr>
            <th className="w-24 pb-2 text-left text-gray-400 font-normal text-xs">
              <span className="sr-only">Time slot</span>
            </th>
            {DAY_LABELS.map((d, i) => (
              <th key={i} className="pb-2 text-center text-gray-500 font-medium text-xs tracking-wide">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="space-y-1">
          {SLOTS.map(slot => (
            <tr key={slot}>
              <td className="pr-3 py-1">
                <div>
                  <p className="text-xs text-gray-600 font-medium">{SLOT_LABELS[slot]}</p>
                  <p className="text-[10px] text-gray-400">{SLOT_TIMES[slot]}</p>
                </div>
              </td>
              {DAYS.map(day => {
                const active = (value[day] || []).includes(slot)
                return (
                  <td key={day} className="px-0.5 py-1">
                    <button
                      type="button"
                      onClick={() => toggle(day, slot)}
                      disabled={disabled}
                      title={`${SLOT_LABELS[slot]} on ${day}`}
                      className={`w-full h-8 rounded-lg border transition-all text-xs font-medium ${
                        active
                          ? "bg-blue-500 border-blue-500 text-white shadow-sm"
                          : "bg-gray-50 border-gray-200 text-transparent hover:bg-gray-100 hover:border-gray-300"
                      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    >
                      {active ? "✓" : "·"}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-400 mt-2">
        Click cells to toggle availability. Blue = available.
      </p>
    </div>
  )
}
