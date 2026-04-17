'use client'

import { useEffect, useState } from 'react'
import { requestAPI, matchingAPI, dashboardAPI, MatchCandidate, AutoAssignResult } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NGOMatchDisplay } from '@/components/ngo-match-display'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface DashboardStats {
  total_volunteers: number
  active_requests: number
  completed_tasks: number
  total_assignments: number
  average_reliability: number
  pending_assignments: number
}

export default function CoordinatorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [matchCandidates, setMatchCandidates] = useState<MatchCandidate[]>([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [assignmentStatus, setAssignmentStatus] = useState<{ success: boolean; message: string } | null>(null)

  // Load dashboard stats
  useEffect(() => {
    const loadData = async () => {
      try {
        const statsResult = await dashboardAPI.getStats()
        if (statsResult.data) {
          setStats(statsResult.data as DashboardStats)
        }

        const requestsResult = await requestAPI.getAll(0, 100)
        if (requestsResult.data) {
          setRequests((requestsResult.data as any[]) || [])
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleRequestSelect = async (request: any) => {
    setSelectedRequest(request)
    setMatchLoading(true)

    try {
      const result = await matchingAPI.getMatches(request.id, 10)
      if ((result.data as any)?.candidates) {
        setMatchCandidates((result.data as any).candidates)
      }
    } catch (error) {
      console.error('Error getting matches:', error)
    } finally {
      setMatchLoading(false)
    }
  }

  const handleAssignVolunteer = async (volunteerName: string) => {
    if (!selectedRequest) return

    try {
      const result = await matchingAPI.autoAssign(selectedRequest.id)
      const assignResult = result.data as AutoAssignResult

      if (assignResult.success) {
        setAssignmentStatus({
          success: true,
          message: `✓ ${volunteerName} has been assigned!`,
        })
        setTimeout(() => setAssignmentStatus(null), 3000)
      } else {
        setAssignmentStatus({
          success: false,
          message: assignResult.message,
        })
      }
    } catch (error) {
      setAssignmentStatus({
        success: false,
        message: 'Failed to assign volunteer',
      })
    }
  }

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
        <h1 className="text-3xl font-bold mb-2">NGO Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}! Monitor and manage volunteer requests.</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Volunteers</p>
            <p className="text-2xl font-bold text-primary">{stats.total_volunteers}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Active Requests</p>
            <p className="text-2xl font-bold text-blue-500">{stats.active_requests}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-500">{stats.completed_tasks}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Assignments</p>
            <p className="text-2xl font-bold text-purple-500">{stats.total_assignments}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-500">{stats.pending_assignments}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium mb-1">Avg Reliability</p>
            <p className="text-2xl font-bold text-emerald-500">{(stats.average_reliability * 100).toFixed(0)}%</p>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Requests List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Requests</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No requests created yet</p>
            ) : (
              requests.slice(0, 8).map((req: any) => (
                <Button
                  key={req.id}
                  variant={selectedRequest?.id === req.id ? 'default' : 'outline'}
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleRequestSelect(req)}
                >
                  <div className="text-left">
                    <p className="font-medium">{req.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.type} • Urgency: {req.urgency}/5 • Status: {req.status}
                    </p>
                  </div>
                </Button>
              ))
            )}
          </div>
        </Card>

        {/* Matching Section */}
        <div className="space-y-4">
          {selectedRequest ? (
            <>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Request Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Title</p>
                    <p className="font-medium">{selectedRequest.title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Description</p>
                    <p className="font-medium">{selectedRequest.description}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <Badge>{selectedRequest.type}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Urgency</p>
                      <Badge variant="secondary">{selectedRequest.urgency}/5</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant="outline">{selectedRequest.status}</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {assignmentStatus && (
                <Card className={`p-4 ${assignmentStatus.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex gap-2">
                    {assignmentStatus.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <p className={assignmentStatus.success ? 'text-green-800' : 'text-red-800'}>{assignmentStatus.message}</p>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <p>Select a request to view matching volunteers</p>
            </Card>
          )}
        </div>
      </div>

      {/* Matching Candidates */}
      {selectedRequest && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Matching Volunteers</h2>
          <NGOMatchDisplay
            candidates={matchCandidates}
            onAssign={handleAssignVolunteer}
            isLoading={matchLoading}
          />
        </Card>
      )}
    </div>
  )
}
