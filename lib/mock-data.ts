export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  availability: string;
  reliabilityScore: number;
  tasksCompleted: number;
  location: string;
}

export interface VolunteerRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  requiredSkills: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  volunteersNeeded: number;
  volunteersAssigned: number;
  status: 'open' | 'in-progress' | 'completed';
  deadline: string;
  impact: string;
}

export interface MatchResult {
  volunteerId: string;
  requestId: string;
  matchScore: number;
  reason: string;
}

export const mockVolunteers: Volunteer[] = [
  {
    id: 'v1',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '555-0101',
    skills: ['Medical Training', 'First Aid', 'Spanish'],
    availability: 'Weekends',
    reliabilityScore: 98,
    tasksCompleted: 24,
    location: 'San Francisco, CA',
  },
  {
    id: 'v2',
    name: 'James Martinez',
    email: 'james.m@email.com',
    phone: '555-0102',
    skills: ['Construction', 'Heavy Equipment', 'Leadership'],
    availability: 'Full-time',
    reliabilityScore: 95,
    tasksCompleted: 18,
    location: 'Oakland, CA',
  },
  {
    id: 'v3',
    name: 'Amanda Wilson',
    email: 'amanda.w@email.com',
    phone: '555-0103',
    skills: ['Logistics', 'Supply Chain', 'Organization'],
    availability: 'Evenings',
    reliabilityScore: 92,
    tasksCompleted: 15,
    location: 'Berkeley, CA',
  },
  {
    id: 'v4',
    name: 'David Lee',
    email: 'david.lee@email.com',
    phone: '555-0104',
    skills: ['Teaching', 'Childcare', 'English as Second Language'],
    availability: 'Weekends',
    reliabilityScore: 88,
    tasksCompleted: 12,
    location: 'San Jose, CA',
  },
  {
    id: 'v5',
    name: 'Maria Garcia',
    email: 'maria.g@email.com',
    phone: '555-0105',
    skills: ['Counseling', 'Mental Health', 'Social Services'],
    availability: 'Flexible',
    reliabilityScore: 96,
    tasksCompleted: 20,
    location: 'Palo Alto, CA',
  },
];

export const mockRequests: VolunteerRequest[] = [
  {
    id: 'r1',
    title: 'Medical Assistance at Community Clinic',
    description: 'Need medical professionals to help at the community health clinic providing free check-ups.',
    location: 'Mission District, SF',
    requiredSkills: ['Medical Training', 'First Aid'],
    urgency: 'high',
    volunteersNeeded: 3,
    volunteersAssigned: 2,
    status: 'in-progress',
    deadline: '2024-05-15',
    impact: 'Help 150+ patients this week',
  },
  {
    id: 'r2',
    title: 'Community Center Renovation',
    description: 'Help with reconstruction of the damaged community center. Physical work required.',
    location: 'East Oakland',
    requiredSkills: ['Construction', 'Heavy Equipment'],
    urgency: 'critical',
    volunteersNeeded: 5,
    volunteersAssigned: 3,
    status: 'in-progress',
    deadline: '2024-05-10',
    impact: 'Restore gathering space for 500+ residents',
  },
  {
    id: 'r3',
    title: 'Food Distribution Network Coordination',
    description: 'Organize and coordinate food distribution across multiple locations.',
    location: 'San Francisco Bay Area',
    requiredSkills: ['Logistics', 'Supply Chain', 'Organization'],
    urgency: 'high',
    volunteersNeeded: 4,
    volunteersAssigned: 2,
    status: 'open',
    deadline: '2024-05-20',
    impact: 'Deliver 1000+ meal boxes to families in need',
  },
  {
    id: 'r4',
    title: 'Youth Mentorship Program',
    description: 'Mentor local youth in after-school programs, helping with homework and life skills.',
    location: 'Various Schools',
    requiredSkills: ['Teaching', 'Childcare'],
    urgency: 'medium',
    volunteersNeeded: 6,
    volunteersAssigned: 4,
    status: 'in-progress',
    deadline: '2024-06-01',
    impact: 'Mentor 20+ students weekly',
  },
  {
    id: 'r5',
    title: 'Crisis Counseling Support',
    description: 'Provide emotional support and counseling to affected families.',
    location: 'Community Resource Center',
    requiredSkills: ['Counseling', 'Mental Health'],
    urgency: 'high',
    volunteersNeeded: 3,
    volunteersAssigned: 1,
    status: 'open',
    deadline: '2024-05-18',
    impact: 'Support 30+ individuals in crisis',
  },
];

export const mockMatchResults: MatchResult[] = [
  { volunteerId: 'v1', requestId: 'r1', matchScore: 98, reason: 'Expert in medical training with high availability' },
  { volunteerId: 'v2', requestId: 'r2', matchScore: 96, reason: 'Extensive construction experience and equipment certification' },
  { volunteerId: 'v3', requestId: 'r3', matchScore: 94, reason: 'Perfect logistics background with proven track record' },
  { volunteerId: 'v4', requestId: 'r4', matchScore: 92, reason: 'Excellent teaching skills and experience with youth' },
  { volunteerId: 'v5', requestId: 'r5', matchScore: 99, reason: 'Clinical counseling expertise with compassionate approach' },
  { volunteerId: 'v1', requestId: 'r5', matchScore: 75, reason: 'Some transferable support skills' },
];

export const mockAnalytics = {
  totalVolunteers: 487,
  activeRequests: 12,
  completedTasks: 342,
  volunteersThisMonth: 156,
  averageReliability: 94.2,
  totalImpact: '2,450+ lives helped',
  requestsByUrgency: {
    critical: 2,
    high: 5,
    medium: 3,
    low: 2,
  },
  volunteersWithSkills: {
    'Medical Training': 45,
    'Construction': 32,
    'Logistics': 28,
    'Teaching': 54,
    'Counseling': 38,
  },
  weeklyData: [
    { week: 'Week 1', volunteers: 45, requests: 8, completed: 23 },
    { week: 'Week 2', volunteers: 52, requests: 10, completed: 31 },
    { week: 'Week 3', volunteers: 38, requests: 9, completed: 28 },
    { week: 'Week 4', volunteers: 21, requests: 6, completed: 18 },
  ],
};
