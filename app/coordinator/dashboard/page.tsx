'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Plus, MapPin, AlertCircle, TrendingUp, Home, Settings, LogOut, X, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { mockRequests, mockVolunteers, mockAnalytics } from '@/lib/mock-data';

const COLORS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981'];

export default function CoordinatorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    location: '',
    description: '',
    urgency: 'medium' as const,
  });

  const urgencyColors = {
    critical: 'bg-red-500/10 text-red-700 border-red-200',
    high: 'bg-orange-500/10 text-orange-700 border-orange-200',
    medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
    low: 'bg-green-500/10 text-green-700 border-green-200',
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCreateModal(false);
    setNewRequest({ title: '', location: '', description: '', urgency: 'medium' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 ${!sidebarOpen && '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
                V
              </div>
              <span className="font-semibold text-sidebar-foreground">VolunteerMatch</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden">
              <X className="w-4 h-4 text-sidebar-foreground" />
            </button>
          </div>

          <nav className="space-y-2">
            <Link href="/coordinator/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link href="/coordinator/requests" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <AlertCircle className="w-5 h-5" />
              Requests
            </Link>
            <Link href="/coordinator/volunteers" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <Users className="w-5 h-5" />
              Volunteers
            </Link>
            <Link href="/coordinator/analytics" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <TrendingUp className="w-5 h-5" />
              Analytics
            </Link>
          </nav>

          <div className="pt-8 border-t border-sidebar-border space-y-2">
            <Link href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <Link href="/login" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <LogOut className="w-5 h-5" />
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden">
            <Users className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-8">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Active Volunteers', value: mockAnalytics.totalVolunteers, icon: Users, color: 'text-primary' },
              { label: 'Open Requests', value: mockAnalytics.activeRequests, icon: AlertCircle, color: 'text-orange-500' },
              { label: 'Completed Tasks', value: mockAnalytics.completedTasks, icon: CheckCircle2, color: 'text-green-500' },
              { label: 'This Month', value: mockAnalytics.volunteersThisMonth, icon: TrendingUp, color: 'text-secondary' },
            ].map((stat, idx) => (
              <Card key={idx} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Requests Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Active Requests</h2>
                <Button onClick={() => setShowCreateModal(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Request
                </Button>
              </div>

              <div className="space-y-3">
                {mockRequests.map((req) => (
                  <Card
                    key={req.id}
                    className={`p-4 cursor-pointer transition-colors hover:border-primary/50 ${selectedRequest === req.id ? 'border-primary/50 bg-primary/5' : ''}`}
                    onClick={() => setSelectedRequest(req.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold">{req.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {req.location}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${urgencyColors[req.urgency]}`}>
                          {req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            {req.volunteersAssigned}/{req.volunteersNeeded} assigned
                          </span>
                          <span className="text-xs text-muted-foreground">Due: {req.deadline}</span>
                        </div>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(req.volunteersAssigned / req.volunteersNeeded) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* AI Matching Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">AI Matching Engine</h2>
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Top Recommendations</p>
                    <p className="text-xs text-muted-foreground">Based on selected request</p>
                  </div>

                  {selectedRequest ? (
                    <div className="space-y-2">
                      {mockVolunteers.slice(0, 3).map((vol) => (
                        <div key={vol.id} className="p-3 bg-background rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{vol.name}</p>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">98%</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {vol.skills.slice(0, 2).map((skill) => (
                              <span key={skill} className="text-xs bg-muted px-2 py-0.5 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                          <Button size="sm" className="w-full mt-2" variant="outline">
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Select a request to see recommendations</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Weekly Activity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockAnalytics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="volunteers" stroke="var(--color-primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" stroke="var(--color-secondary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Requests by Urgency</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Critical', value: mockAnalytics.requestsByUrgency.critical },
                      { name: 'High', value: mockAnalytics.requestsByUrgency.high },
                      { name: 'Medium', value: mockAnalytics.requestsByUrgency.medium },
                      { name: 'Low', value: mockAnalytics.requestsByUrgency.low },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color) => (
                      <Cell key={`cell-${color}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Request</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g., Medical Assistance"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  placeholder="e.g., San Francisco, CA"
                  value={newRequest.location}
                  onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground"
                  placeholder="Describe the request and requirements"
                  rows={4}
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Urgency</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
                  value={newRequest.urgency}
                  onChange={(e) => setNewRequest({ ...newRequest, urgency: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Create Request
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
