'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Award, Target, Download, Home, AlertCircle, Settings, LogOut } from 'lucide-react';
import { mockAnalytics } from '@/lib/mock-data';

const COLORS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444'];

export default function AnalyticsPage() {
  const skillsData = Object.entries(mockAnalytics.volunteersWithSkills).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border hidden md:block">
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              V
            </div>
            <span className="font-semibold text-sidebar-foreground">VolunteerMatch</span>
          </div>

          <nav className="space-y-2">
            <Link href="/coordinator/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
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
            <Link href="/coordinator/analytics" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-medium">
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
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-8">
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Total Volunteers', value: mockAnalytics.totalVolunteers, icon: Users, color: 'text-primary' },
              { label: 'Active Requests', value: mockAnalytics.activeRequests, icon: AlertCircle, color: 'text-orange-500' },
              { label: 'Completed Tasks', value: mockAnalytics.completedTasks, icon: Award, color: 'text-green-500' },
              { label: 'Avg Reliability', value: `${mockAnalytics.averageReliability}%`, icon: TrendingUp, color: 'text-secondary' },
              { label: 'Total Impact', value: mockAnalytics.totalImpact, icon: Target, color: 'text-accent' },
            ].map((stat, idx) => (
              <Card key={idx} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Main Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Volunteer Growth */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Volunteer & Task Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockAnalytics.weeklyData}>
                  <defs>
                    <linearGradient id="colorVolunteers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="volunteers"
                    stroke="var(--color-primary)"
                    fillOpacity={1}
                    fill="url(#colorVolunteers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Weekly Performance */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Weekly Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockAnalytics.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requests" fill="var(--color-secondary)" />
                  <Bar dataKey="completed" fill="var(--color-accent)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Skills Distribution */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Volunteers by Skill</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={skillsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Request Status Distribution */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Requests by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'In Progress', value: 5 },
                      { name: 'Open', value: 4 },
                      { name: 'Completed', value: 8 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
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

          {/* Detailed Metrics */}
          <Card className="p-6">
            <h3 className="font-semibold mb-6">Request Metrics</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: 'Critical Requests',
                  value: mockAnalytics.requestsByUrgency.critical,
                  description: 'Urgent needs requiring immediate attention',
                },
                {
                  label: 'High Priority',
                  value: mockAnalytics.requestsByUrgency.high,
                  description: 'Important requests due within 1-2 weeks',
                },
                {
                  label: 'Average Matching Score',
                  value: '94.2%',
                  description: 'AI matching accuracy and volunteer fit',
                },
                {
                  label: 'Volunteer Utilization',
                  value: '87%',
                  description: 'Percentage of active volunteers assigned',
                },
                {
                  label: 'Task Completion Rate',
                  value: '96%',
                  description: 'Percentage of completed vs total tasks',
                },
                {
                  label: 'Avg Assignment Time',
                  value: '2.3 hrs',
                  description: 'Time from request to assignment',
                },
              ].map((metric, idx) => (
                <div key={idx} className="space-y-2 p-4 rounded-lg bg-muted/40">
                  <p className="text-2xl font-bold text-primary">{metric.value}</p>
                  <p className="font-medium text-sm">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Impact Summary */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <h3 className="font-semibold mb-4 text-lg">Impact Summary</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Cumulative Impact</p>
                <p className="text-3xl font-bold text-primary">{mockAnalytics.totalImpact}</p>
                <p className="text-xs text-muted-foreground">Total lives helped across all initiatives</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Community Engagement</p>
                <p className="text-3xl font-bold text-secondary">{mockAnalytics.totalVolunteers}</p>
                <p className="text-xs text-muted-foreground">Active volunteers in the network</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
