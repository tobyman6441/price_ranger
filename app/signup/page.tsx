import { SignUpForm } from '@/components/auth/signup-form'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '../../public/images/price_ranger_logo.png'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 flex flex-col items-center">
        <Image
          src={Logo}
          alt="Price Ranger Logo"
          width={200}
          height={200}
          priority
        />
        <p className="text-center text-lg text-muted-foreground max-w-md">
          A simple and flexible tool for{' '}
          <br />
          pricing home improvement projects
        </p>
      </div>
      <SignUpForm />
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  )
} 