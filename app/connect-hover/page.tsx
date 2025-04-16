"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function ConnectHoverPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connect to Hover</CardTitle>
          <CardDescription>
            Integrate your Price Ranger account with Hover to streamline your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-8">
            {/* Price Ranger Logo */}
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              <Image
                src="/images/price_ranger_logo.png"
                alt="Price Ranger Logo"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Integration Icon */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-transparent flex items-center justify-center">
                <Link2 className="w-10 h-10 text-gray-400 rotate-45" />
              </div>
            </div>

            {/* Hover Logo */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-md">
              <Image
                src="/brand/logos/App icon/iOS/hover_app.png"
                alt="Hover Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="grid gap-6 mt-8">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Benefits of connecting:</h3>
              <ul className="space-y-2 text-gray-600 pl-5">
                <li className="pl-2">
                  <span className="flex">
                    <span className="absolute -ml-5">•</span>
                    <span>Use Hover to accurately scope projects</span>
                  </span>
                </li>
                <li className="pl-2">
                  <span className="flex">
                    <span className="absolute -ml-5">•</span>
                    <span>Automatically import material and labor costs scoped in Hover to seamlessly calculate your customer facing pricing in Price Ranger</span>
                  </span>
                </li>
                <li className="pl-2">
                  <span className="flex">
                    <span className="absolute -ml-5">•</span>
                    <span>Upload before and after designs created in Hover to your price ranger proposals</span>
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-4 pt-4">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => {
                  // TODO: Implement actual Hover API integration
                  window.open('https://hover.to/auth/signin', '_blank');
                }}
              >
                Connect your Hover account
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => router.back()}
              >
                Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 