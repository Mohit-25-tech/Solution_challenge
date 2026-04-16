'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const [role, setRole] = useState<'ngo' | 'volunteer' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    setIsLoading(true);
    
    // Simulate signup
    setTimeout(() => {
      setIsLoading(false);
      if (role === 'ngo') {
        router.push('/coordinator/dashboard');
      } else {
        router.push('/volunteer/portal');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Get Started</h1>
          <p className="text-muted-foreground">Create your VolunteerMatch account</p>
        </div>

        {!role ? (
          <Card className="p-6 space-y-4">
            <div className="space-y-3">
              <p className="font-medium text-center mb-4">I want to</p>
              <Button
                onClick={() => setRole('ngo')}
                className="w-full h-16 justify-start text-left flex flex-col"
                variant="outline"
              >
                <p className="font-semibold">Coordinate Volunteers</p>
                <p className="text-xs text-muted-foreground">NGO, Organization, or Team Lead</p>
              </Button>
              <Button
                onClick={() => setRole('volunteer')}
                className="w-full h-16 justify-start text-left flex flex-col"
                variant="outline"
              >
                <p className="font-semibold">Volunteer My Time</p>
                <p className="text-xs text-muted-foreground">Individual Volunteer</p>
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setRole(null)}
                className="text-muted-foreground hover:text-foreground transition"
              >
                ← Back
              </button>
              <p className="text-sm font-medium">
                {role === 'ngo' ? 'Organization Account' : 'Volunteer Account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  {role === 'ngo' ? 'Organization Name' : 'Full Name'}
                </label>
                <Input
                  id="name"
                  placeholder={role === 'ngo' ? 'Your Organization' : 'John Doe'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full">
                Google
              </Button>
              <Button variant="outline" className="w-full">
                GitHub
              </Button>
            </div>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
