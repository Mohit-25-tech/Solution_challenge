'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, MapPin, Clock, Award, CheckCircle2, LogOut, Settings, Heart, Filter, Home, Briefcase, X } from 'lucide-react';
import { mockRequests, mockVolunteers } from '@/lib/mock-data';

const urgencyColors = {
  critical: 'bg-red-500/10 text-red-700 border-red-200',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  low: 'bg-green-500/10 text-green-700 border-green-200',
};

export default function VolunteerPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentVolunteer] = useState(mockVolunteers[0]); // Mock current user
  const [myTasks, setMyTasks] = useState<string[]>(['r1', 'r2']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const availableTasks = mockRequests.filter((req) => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = !filterSkill || req.requiredSkills.some(skill =>
      skill.toLowerCase().includes(filterSkill.toLowerCase())
    );
    return matchesSearch && matchesSkill && !myTasks.includes(req.id);
  });

  const assignedTasks = mockRequests.filter(req => myTasks.includes(req.id));

  const handleApply = (requestId: string) => {
    setMyTasks([...myTasks, requestId]);
    setSelectedTask(null);
  };

  const handleRemove = (requestId: string) => {
    setMyTasks(myTasks.filter(id => id !== requestId));
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
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-2">
            <Link href="/volunteer/portal" className="flex items-center gap-3 px-4 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-medium">
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link href="/volunteer/available" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <Briefcase className="w-5 h-5" />
              Available Tasks
            </Link>
            <Link href="/volunteer/profile" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition">
              <Award className="w-5 h-5" />
              My Profile
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
          <h1 className="text-2xl font-bold">Welcome, {currentVolunteer.name}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              {currentVolunteer.name}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-8">
          {/* Profile Card */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{currentVolunteer.name}</h2>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {currentVolunteer.location}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {currentVolunteer.availability}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-primary">{currentVolunteer.reliabilityScore}%</p>
                  <p className="text-xs text-muted-foreground">Reliability Score</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-secondary">{currentVolunteer.tasksCompleted}</p>
                  <p className="text-xs text-muted-foreground">Tasks Completed</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">
                {currentVolunteer.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* My Assigned Tasks */}
          {assignedTasks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                My Assigned Tasks ({assignedTasks.length})
              </h2>
              <div className="grid gap-4">
                {assignedTasks.map((task) => (
                  <Card key={task.id} className="p-4 border-green-200 bg-green-500/5 hover:border-primary/50 transition cursor-pointer">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold">{task.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {task.location}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-700">Assigned</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Due: {task.deadline}</span>
                        <span className="px-2 py-1 rounded bg-background text-xs">{task.impact}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleRemove(task.id)}>
                        Withdraw
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Available Opportunities</h2>
              <span className="text-sm text-muted-foreground">{availableTasks.length} available</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sm:flex-1"
              />
              <Input
                placeholder="Filter by skill..."
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="sm:w-48"
              />
            </div>
          </div>

          {/* Available Tasks */}
          <div className="grid gap-4">
            {availableTasks.length > 0 ? (
              availableTasks.map((req) => (
                <Card
                  key={req.id}
                  className={`p-4 cursor-pointer transition-colors ${selectedTask === req.id ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedTask(req.id)}
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

                    <p className="text-sm text-muted-foreground">{req.description}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Skills needed: {req.requiredSkills.join(', ')}</span>
                      <span>Due: {req.deadline}</span>
                    </div>

                    {selectedTask === req.id && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(req.id);
                        }}
                        className="w-full mt-2"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Apply to Help
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                <p>No opportunities match your search. Try adjusting your filters.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
