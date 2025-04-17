import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Get the user
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Update team member status to active
      await supabase
        .from('team_members')
        .update({ status: 'active' })
        .eq('email', user.email)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin))
} 