"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Link2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getHoverAuthUrl, getHoverTokens } from "@/lib/hover-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ConnectHoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');

    if (errorParam) {
      setError(errorParam);
    }
    if (successParam === 'true') {
      setSuccess(true);
      checkConnection();
    }

    checkConnection();
  }, [searchParams]);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const tokens = await getHoverTokens(user.id);
        setIsConnected(!!tokens);
      }
    } catch (error) {
      console.error('Error checking Hover connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const authUrl = await getHoverAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      setError('Failed to start authentication process');
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('hover_tokens')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
        setIsConnected(false);
        setSuccess(false);
      }
    } catch (error) {
      console.error('Error disconnecting Hover:', error);
      setError('Failed to disconnect Hover account');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-3xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connect to Hover</CardTitle>
          <CardDescription>
            {isConnected 
              ? "Your Price Ranger account is connected to Hover"
              : "Integrate your Price Ranger account with Hover to streamline your workflow"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error === 'no_code' && 'No authorization code received from Hover.'}
                {error === 'no_user' && 'You must be logged in to connect your Hover account.'}
                {error === 'auth_failed' && 'Failed to authenticate with Hover. Please try again.'}
                {error === 'Failed to start authentication process' && 'Failed to start authentication process. Please try again.'}
                {error === 'Failed to disconnect Hover account' && 'Failed to disconnect Hover account. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {success && !isConnected && (
            <Alert className="mb-6">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your Hover account has been successfully connected.
              </AlertDescription>
            </Alert>
          )}

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
                <Link2 className={`w-10 h-10 ${isConnected ? 'text-primary' : 'text-gray-400'} rotate-45`} />
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
              {isConnected ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-primary mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Connected to Hover</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={handleDisconnect}
                  >
                    Disconnect Hover account
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleConnect}
                >
                  Connect your Hover account
                </Button>
              )}
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