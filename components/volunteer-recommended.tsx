'use client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Zap, AlertCircle, Star } from 'lucide-react'

interface MatchCandidate {
  volunteer_id: number;
  match_score: number;
  reason: string;
  distance_km: number;
  request_id?: number;
  breakdown?: any;
}

interface VolunteerRecommendedProps {
  task: MatchCandidate | null
  isLoading?: boolean
  onAccept?: (taskId: number) => void
  onViewDetails?: () => void
}

export function VolunteerRecommended({ task, isLoading, onAccept, onViewDetails }: VolunteerRecommendedProps) {
  if (isLoading) {
    return (
      <Card className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </Card>
    )
  }

  if (!task) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-semibold mb-1">No recommendations right now</p>
        <p className="text-sm">Check back later or update your profile location and skills.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Best Match For You</p>
          <h3 className="text-2xl font-bold mt-1">Perfect Opportunity</h3>
        </div>
        <Badge className="bg-primary text-primary-foreground text-base px-3 py-1">
          {(task.match_score * 100).toFixed(0)}% Match
        </Badge>
      </div>

      {/* Match Details */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Distance</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {task.distance_km} km
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Why You're Perfect</p>
            <p className="text-sm">{task.reason}</p>
          </div>
        </div>

        {/* Score Breakdown */}
        {task.breakdown && (
          <div className="p-3 bg-card rounded-lg border border-border">
            <p className="text-xs text-muted-foreground font-medium mb-2">Score Breakdown:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Skill Match:</span>
                <span className="font-semibold">{(task.breakdown.skill * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Proximity:</span>
                <span className="font-semibold">{(task.breakdown.distance * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Urgency Level:</span>
                <span className="font-semibold">{(task.breakdown.urgency * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Your Reliability:</span>
                <span className="font-semibold">{(task.breakdown.reliability * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onAccept?.(task.request_id || 0)}
            className="flex-1 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Accept Task
          </Button>
          <Button variant="outline" onClick={onViewDetails} className="flex-1">
            View Details
          </Button>
        </div>
      </div>

      {/* Tip */}
      <div className="p-3 bg-secondary/10 rounded-lg flex gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Quick tip:</span> The sooner you accept, the better for those in need!
        </p>
      </div>
    </Card>
  )
}
