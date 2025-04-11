import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, first_name, last_name, phone_number, role, organization_id } = body

    const supabase = createRouteHandlerClient({ cookies })

    // Generate a sign-up link with pre-filled data
    const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: {
        first_name,
        last_name,
        organization_id,
        role
      }
    })

    if (signUpError) {
      console.error('Error creating user:', signUpError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create team member record
    const { error: teamMemberError } = await supabase
      .from('team_members')
      .insert([
        {
          organization_id,
          user_id: user?.id,
          email,
          first_name,
          last_name,
          phone_number: phone_number || null,
          role,
          status: 'pending'
        }
      ])

    if (teamMemberError) {
      console.error('Error creating team member:', teamMemberError)
      // Clean up the created user if team member creation fails
      await supabase.auth.admin.deleteUser(user!.id)
      return NextResponse.json(
        { error: 'Failed to create team member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in invite route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 