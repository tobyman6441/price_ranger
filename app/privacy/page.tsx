import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function PrivacyPage() {
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
            <CardTitle className="text-2xl font-bold">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: April 10, 2024</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                priceranger.app ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">2. Information We Collect</h2>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <h3 className="font-medium">Personal Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Email address</li>
                  <li>Password (encrypted)</li>
                  <li>Account preferences</li>
                  <li>Usage data and analytics</li>
                </ul>
                <h3 className="font-medium mt-4">Automatically Collected Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Device information</li>
                  <li>Log data</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide and maintain our Service</li>
                  <li>Notify you about changes to our Service</li>
                  <li>Provide customer support</li>
                  <li>Monitor the usage of our Service</li>
                  <li>Detect, prevent and address technical issues</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">5. Your Rights</h2>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Object to processing of your information</li>
                  <li>Data portability</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-xl font-semibold">6. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 