import { createClient } from '@supabase/supabase-js';

// Hover OAuth configuration
const HOVER_CLIENT_ID = process.env.NEXT_PUBLIC_HOVER_CLIENT_ID;
const HOVER_CLIENT_SECRET = process.env.HOVER_CLIENT_SECRET;
const HOVER_REDIRECT_URI = process.env.NEXT_PUBLIC_HOVER_REDIRECT_URI || 'http://localhost:3000/api/auth/hover/callback';
const HOVER_AUTH_URL = 'https://hover.to/oauth/authorize';
const HOVER_TOKEN_URL = 'https://hover.to/oauth/token';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getHoverAuthUrl() {
  if (!HOVER_CLIENT_ID) {
    throw new Error('HOVER_CLIENT_ID is not configured');
  }

  const params = new URLSearchParams({
    client_id: HOVER_CLIENT_ID,
    redirect_uri: HOVER_REDIRECT_URI,
    response_type: 'code',
    scope: 'read write',
  });

  return `${HOVER_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  if (!HOVER_CLIENT_ID || !HOVER_CLIENT_SECRET) {
    throw new Error('Hover credentials are not configured');
  }

  const response = await fetch(HOVER_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: HOVER_CLIENT_ID,
      client_secret: HOVER_CLIENT_SECRET,
      redirect_uri: HOVER_REDIRECT_URI,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const data = await response.json();
  return data;
}

export async function refreshToken(refreshToken: string) {
  if (!HOVER_CLIENT_ID || !HOVER_CLIENT_SECRET) {
    throw new Error('Hover credentials are not configured');
  }

  const response = await fetch(HOVER_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: HOVER_CLIENT_ID,
      client_secret: HOVER_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data;
}

export async function saveHoverTokens(userId: string, accessToken: string, refreshToken: string) {
  const { error } = await supabase
    .from('hover_tokens')
    .upsert({
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
}

export async function getHoverTokens(userId: string) {
  const { data, error } = await supabase
    .from('hover_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
} 