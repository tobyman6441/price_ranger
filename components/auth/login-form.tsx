'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendVerification = async (email: string) => {
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before requesting another verification email`)
      return
    }

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: 'https://priceranger.app/auth/callback',
        },
      })
      
      if (resendError) {
        if (resendError.message.includes('rate limit')) {
          const waitSeconds = parseInt(resendError.message.match(/\d+/)?.[0] || '60')
          setResendCooldown(waitSeconds)
          toast.error(`Please wait ${waitSeconds} seconds before requesting another verification email`)
        } else {
          toast.error('Error resending verification email: ' + resendError.message)
        }
      } else {
        setResendCooldown(60) // Set default cooldown
        toast.success('Verification email sent! Please check your inbox.')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred while sending verification email')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Email not confirmed') {
          toast.error('Your email is not verified.', {
            description: 'Click the button below to resend the verification email.',
            action: {
              label: resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend Email',
              onClick: () => handleResendVerification(email),
            },
          })
        } else {
          toast.error('Error logging in: ' + error.message)
        }
        return
      }

      toast.success('Successfully logged in!')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-[350px] shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                style={{backgroundColor: "#121212"}}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                style={{backgroundColor: "#121212"}}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Login'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 