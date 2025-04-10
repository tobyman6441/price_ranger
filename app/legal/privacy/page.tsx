import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: April 10, 2024</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Hover Inc. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Price Ranger service.
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <h3 className="font-medium">Personal Information</h3>
              <ul className="list-disc pl-4 space-y-1">
                <li>Email address</li>
                <li>Password (encrypted)</li>
                <li>Account preferences</li>
                <li>Usage data and analytics</li>
              </ul>
              <h3 className="font-medium mt-4">Automatically Collected Information</h3>
              <ul className="list-disc pl-4 space-y-1">
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
              <ul className="list-disc pl-4 space-y-1">
                <li>Provide and maintain our Service</li>
                <li>Notify you about changes to our Service</li>
                <li>Provide customer support</li>
                <li>Gather analysis or valuable information to improve our Service</li>
                <li>Monitor the usage of our Service</li>
                <li>Detect, prevent and address technical issues</li>
              </ul>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Data Security</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Secure data storage practices</li>
              </ul>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Data Sharing and Disclosure</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>We may share your information with:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Service providers and business partners</li>
                <li>Law enforcement or government agencies when required</li>
                <li>Third parties in connection with a business transfer</li>
              </ul>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Data portability</li>
                <li>Withdraw consent</li>
              </ul>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.
            </p>
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Contact Us</h2>
            <div className="text-muted-foreground leading-relaxed">
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <div className="mt-2">
                <p>Hover Inc.</p>
                <p>123 Market Street</p>
                <p>San Francisco, CA 94105</p>
                <p>Email: privacy@hoverinc.com</p>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
} 