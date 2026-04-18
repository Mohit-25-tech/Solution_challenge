'use client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, AlertCircle, Zap } from 'lucide-react'

interface MatchCandidate {
  volunteer_id: number;
  match_score: number;
  reason: string;
  distance_km: number;
  request_id?: number;
  breakdown?: any;
}

interface VolunteerNearbyProps {
  tasks: MatchCandidate[]
  isLoading?: boolean
  onApply?: (taskId: number) => void
}

export function VolunteerNearby({ tasks, isLoading, onApply }: VolunteerNearbyProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-24 bg-muted rounded" />
          </Card>
        ))}
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-semibold mb-1">No tasks nearby</p>
        <p className="text-sm">Try expanding your available area or check back later.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Nearby Work Opportunities</h3>
        <Badge variant="secondary">{tasks.length} tasks</Badge>
      </div>

      {tasks.map((task) => {
        // Determine urgency level
        const getUrgencyColor = (score: number) => {
          if (score >= 0.8) return 'bg-red-100 text-red-900 border-red-300'
          if (score >= 0.6) return 'bg-orange-100 text-orange-900 border-orange-300'
          if (score >= 0.4) return 'bg-yellow-100 text-yellow-900 border-yellow-300'
          return 'bg-green-100 text-green-900 border-green-300'
        }

        const urgencyScore = task.breakdown?.urgency || 0.5

        return (
          <Card key={task.request_id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              {/* Left Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{task.reason}</h4>
                  <Badge variant="outline" className={getUrgencyColor(urgencyScore)}>
                    Urgency: {(urgencyScore * 5).toFixed(0)}/5
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{task.distance_km} km away</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    <span>Match Score: {(task.match_score * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Match Reason */}
                <p className="text-sm text-muted-foreground italic">"{task.reason}"</p>
              </div>

              {/* Right Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApply?.(task.request_id || 0)}
                  className="whitespace-nowrap"
                >
                  Learn More
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApply?.(task.request_id || 0)}
                  className="bg-primary hover:bg-primary/90 whitespace-nowrap"
                >
                  Apply
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
