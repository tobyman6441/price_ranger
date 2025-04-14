import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exchangeCodeForToken, saveHoverTokens } from '@/lib/hover-auth';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/connect-hover?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/connect-hover?error=no_code`);
  }

  try {
    // Exchange the code for tokens
    const tokens = await exchangeCodeForToken(code);

    // Get the current user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${requestUrl.origin}/connect-hover?error=no_user`);
    }

    // Save the tokens
    await saveHoverTokens(user.id, tokens.access_token, tokens.refresh_token);

    // Redirect to success page
    return NextResponse.redirect(`${requestUrl.origin}/connect-hover?success=true`);
  } catch (error) {
    console.error('Error in Hover callback:', error);
    return NextResponse.redirect(`${requestUrl.origin}/connect-hover?error=auth_failed`);
  }
} 