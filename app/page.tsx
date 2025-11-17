import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Clock, Shield } from 'lucide-react';
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-balance bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            CivicResponse
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl">
            Report civic issues, track progress, and make your community better. 
            A transparent system connecting citizens with municipal services.
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">Geolocation Tracking</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Pinpoint exact locations of issues with integrated maps
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-lg">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Citizens, officers, and admins with tailored dashboards
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">SLA Management</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Track response times with automatic escalation workflows
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">Transparent Process</h3>
                <p className="text-sm text-muted-foreground text-balance">
                  Real-time updates and complete activity history
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Report an Issue</h3>
                <p className="text-muted-foreground">
                  Citizens submit issues with photos, location, and descriptions
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Assignment & Tracking</h3>
                <p className="text-muted-foreground">
                  L1 officers review and assign to appropriate departments
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Resolution & Updates</h3>
                <p className="text-muted-foreground">
                  L2 officers resolve issues with real-time status updates
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Verification & Closure</h3>
                <p className="text-muted-foreground">
                  Citizens verify completion and provide feedback
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
