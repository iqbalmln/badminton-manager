'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export function LoginButton({ loginText, loggingInText }: { loginText: string; loggingInText: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? loggingInText : loginText}
    </Button>
  )
}
