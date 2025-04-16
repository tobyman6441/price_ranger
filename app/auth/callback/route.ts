import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // If there's an error, redirect to login with error parameters
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${error}&error_description=${error_description}`, 
        requestUrl.origin)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=no_code&error_description=No code provided', 
        requestUrl.origin)
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange the code for a session
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(
        new URL(`/login?error=session_error&error_description=${sessionError.message}`, 
        requestUrl.origin)
      )
    }

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('User error:', userError)
      return NextResponse.redirect(
        new URL('/login?error=user_error&error_description=Failed to get user', 
        requestUrl.origin)
      )
    }

    // Update team member status to active
    const { error: updateError } = await supabase
      .from('team_members')
      .update({ status: 'active' })
      .eq('email', user.email)

    if (updateError) {
      console.error('Update error:', updateError)
      // Don't redirect on this error as the user is still authenticated
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=callback_error&error_description=Internal server error', 
      request.url)
    )
  }
} 