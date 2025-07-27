import { MailCheck } from 'lucide-react';

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-card text-card-foreground rounded-lg shadow-md">
        <div className="flex justify-center">
          <MailCheck className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Check Your Email</h1>
        <p className="text-muted-foreground">
          We've sent a verification link to your email address. Please click the
          link to complete your registration.
        </p>
        <p className="text-sm text-muted-foreground">
          (Don't forget to check your spam folder!)
        </p>
      </div>
    </div>
  );
}
