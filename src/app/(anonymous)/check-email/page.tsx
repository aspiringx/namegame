import { MailCheck } from 'lucide-react'

export default function CheckEmailPage() {
  return (
    <div className="bg-background text-foreground mt-12 flex min-h-screen flex-col items-center justify-start">
      <div className="bg-card text-card-foreground w-full max-w-md space-y-6 rounded-lg p-8 text-center shadow-md">
        <div className="flex justify-center">
          <MailCheck className="text-primary h-16 w-16" />
        </div>
        <h1 className="text-3xl font-bold">Check Your Email</h1>
        <p className="text-muted-foreground">
          We&apos;ve sent a verification link to your email address. Please click the
          link to complete your registration.
        </p>
        <p className="text-muted-foreground text-sm">
          (Don&apos;t forget to check your spam folder!)
        </p>
      </div>
    </div>
  )
}
