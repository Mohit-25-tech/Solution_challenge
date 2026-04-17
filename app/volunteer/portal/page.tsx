'use client'

import { useEffect, useState } from 'react'
import { volunteerAPI, MatchCandidate } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { VolunteerRecommended } from '@/components/volunteer-recommended'
import { VolunteerNearby } from '@/components/volunteer-nearby'

export default function VolunteerPortal() {
  const { user } = useAuth()
  const [recommended, setRecommended] = useState<MatchCandidate | null>(null)
  const [nearby, setNearby] = useState<MatchCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [nearbyLoading, setNearbyLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        // Get recommended task
        const recResult = await volunteerAPI.getRecommended(user.id)
        if ((recResult.data as any)?.request_id) {
          setRecommended(recResult.data as MatchCandidate)
        }

        // Get nearby tasks (using mock location for demo)
        const lat = 37.7749
        const lng = -122.4194
        setNearbyLoading(true)
        const nearbyResult = await volunteerAPI.getNearby(user.id, lat, lng, 10)
        if (Array.isArray(nearbyResult.data)) {
          setNearby(nearbyResult.data)
        }
      } catch (error) {
        console.error('Error loading volunteer data:', error)
      } finally {
        setLoading(false)
        setNearbyLoading(false)
      }
    }

    loadData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Volunteer Portal</h1>
        <p className="text-muted-foreground">Welcome, {user?.name}! Find and accept volunteer opportunities.</p>
      </div>

      {/* Recommended Task */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Best Match</h2>
        <VolunteerRecommended
          task={recommended}
          isLoading={loading}
          onAccept={(taskId) => {
            console.log('Accepting task:', taskId)
            // Call API to auto-accept
          }}
          onViewDetails={() => {
            console.log('View details')
          }}
        />
      </div>

      {/* Nearby Tasks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Nearby Opportunities</h2>
        <VolunteerNearby
          tasks={nearby}
          isLoading={nearbyLoading}
          onApply={(taskId) => {
            console.log('Applying for task:', taskId)
            // Call API to apply
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Tasks Accepted</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Completed</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Your Reliability</p>
          <p className="text-2xl font-bold">100%</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Hours Donated</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
      </div>
    </div>
  )
}
