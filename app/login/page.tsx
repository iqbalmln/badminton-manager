import { redirect } from 'next/navigation'
import { getUser, signIn } from '@/lib/actions/auth'
import { getT } from '@/lib/i18n/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoginButton } from '@/components/auth/LoginButton'
import { ShieldCheck } from 'lucide-react'

export default async function LoginPage() {
  const [user, t] = await Promise.all([getUser(), Promise.resolve(getT())])
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl">{t.loginTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.loginSubtitle}</p>
        </CardHeader>
        <CardContent>
          <form action={signIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t.emailLabel}</Label>
              <Input id="email" name="email" type="email" placeholder="admin@example.com" required autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t.passwordLabel}</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>
            <LoginButton loginText={t.loginBtn} loggingInText={t.loggingIn} />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
