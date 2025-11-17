import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from 'lucide-react';
import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle className="text-2xl">Check your email</CardTitle>
            </div>
            <CardDescription>
              We&apos;ve sent you a confirmation email to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please check your inbox and click the confirmation link to activate your account. 
              Once confirmed, you can log in and start reporting civic issues.
            </p>
            <Link href="/auth/login" className="text-sm text-primary underline underline-offset-4">
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
