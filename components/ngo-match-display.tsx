'use client'

import { MatchCandidate } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Zap, Award, TrendingUp } from 'lucide-react'

interface NGOMatchDisplayProps {
  candidates: MatchCandidate[]
  onAssign: (volunteerName: string) => void
  isLoading?: boolean
}

export function NGOMatchDisplay({ candidates, onAssign, isLoading }: NGOMatchDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    )
  }

  if (!candidates || candidates.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No matching volunteers found at this moment.</p>
        <p className="text-sm mt-2">Try adjusting urgency or location radius.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Top Matching Volunteers</h3>
        <Badge variant="secondary">{candidates.length} volunteers</Badge>
      </div>

      {candidates.map((candidate, idx) => (
        <Card key={candidate.volunteer_id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-primary">
          <div className="flex items-start justify-between gap-4">
            {/* Left Section */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-lg">{candidate.volunteer_name}</h4>
                <Badge variant="outline" className="bg-primary text-primary-foreground">
                  #{idx + 1}
                </Badge>
              </div>

              {/* Match Score */}
              <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">Score: {(candidate.match_score * 100).toFixed(0)}%</span>
                </div>
                {candidate.breakdown && (
                  <div className="text-xs text-muted-foreground mt-1 grid grid-cols-4 gap-2 mt-2">
                    <div>
                      <span className="font-medium">Skill:</span> {(candidate.breakdown.skill * 100).toFixed(0)}%
                    </div>
                    <div>
                      <span className="font-medium">Distance:</span> {(candidate.breakdown.distance * 100).toFixed(0)}%
                    </div>
                    <div>
                      <span className="font-medium">Urgency:</span> {(candidate.breakdown.urgency * 100).toFixed(0)}%
                    </div>
                    <div>
                      <span className="font-medium">Reliability:</span> {(candidate.breakdown.reliability * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <p className="text-sm text-muted-foreground mb-3 flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">✔</span>
                {candidate.reason}
              </p>

              {/* Distance & Reliability */}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{candidate.distance_km} km away</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>Reliability: {(candidate.volunteer.reliability_score * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Skills */}
              {candidate.volunteer.skills && candidate.volunteer.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {candidate.volunteer.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="lowercase">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div>
              <Button
                onClick={() => onAssign(candidate.volunteer_name)}
                className="h-10 bg-primary hover:bg-primary/90"
              >
                Assign
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
