import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <Link 
          href="/signup" 
          className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block"
        >
          ← Back to Sign Up
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: April 10, 2024</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using priceranger.app, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                priceranger.app is a home improvement price presentation tool that allows users to create, manage, and share pricing information for home improvement projects. The service is provided "as is" and "as available" without any warranty or representation.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">3. User Accounts</h2>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <p>When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.</p>
                <p>You are responsible for safeguarding the password and for all activities that occur under your account. You agree not to disclose your password to any third party.</p>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">4. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by priceranger.app and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">5. User Content</h2>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <p>You retain all rights to any content you submit, post, or display on or through the Service. By submitting content, you grant priceranger.app a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and distribute such content.</p>
                <p>You are solely responsible for your content and the consequences of posting it. We reserve the right to remove any content that violates these Terms or that we find objectionable.</p>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">6. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 