'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ArrowLeft } from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  role: string
  status: 'pending' | 'active'
  avatar_url?: string
}

export default function TeamPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'individual_contributor'
  })
  const [loading, setLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Check if user has an organization
        if (!user.user_metadata?.organization_id) {
          // First check if user already has an organization
          const { data: existingOrg } = await supabase
            .from('organizations')
            .select('id')
            .single()

          let organizationId = existingOrg?.id

          if (!organizationId) {
            // Create a new organization for the user
            const { data: org, error: orgError } = await supabase
              .from('organizations')
              .insert({
                name: `${user.email}'s Organization`
              })
              .select()
              .single()

            if (orgError) {
              console.error('Organization creation error:', orgError)
              throw new Error(`Failed to create organization: ${orgError.message}`)
            }

            organizationId = org.id
          }

          // Update user metadata with organization_id
          const { error: updateError } = await supabase.auth.updateUser({
            data: { organization_id: organizationId }
          })

          if (updateError) {
            console.error('User metadata update error:', updateError)
            throw new Error(`Failed to update user metadata: ${updateError.message}`)
          }

          // Check if user already has a team member record
          const { data: existingMember } = await supabase
            .from('team_members')
            .select('*')
            .eq('email', user.email)
            .eq('organization_id', organizationId)
            .single()

          if (!existingMember) {
            // Create initial team member record for the user
            const { error: teamMemberError } = await supabase
              .from('team_members')
              .insert([
                {
                  organization_id: organizationId,
                  user_id: user.id,
                  email: user.email,
                  first_name: user.user_metadata?.first_name || 'Admin',
                  last_name: user.user_metadata?.last_name || 'User',
                  role: 'admin',
                  status: 'active'
                }
              ])

            if (teamMemberError) {
              console.error('Team member creation error:', teamMemberError)
              throw new Error(`Failed to create team member: ${teamMemberError.message}`)
            }
          }

          // Fetch all team members
          const { data: members, error: fetchError } = await supabase
            .from('team_members')
            .select('*')
            .eq('organization_id', organizationId)

          if (fetchError) {
            console.error('Team member fetch error:', fetchError)
            throw new Error(`Failed to fetch team members: ${fetchError.message}`)
          }
          
          setTeamMembers(members || [])
        } else {
          // Fetch existing team members
          const { data: members, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('organization_id', user.user_metadata.organization_id)

          if (error) {
            console.error('Team member fetch error:', error)
            throw new Error(`Failed to fetch team members: ${error.message}`)
          }
          
          setTeamMembers(members || [])
        }
      } catch (error) {
        console.error('Error in fetchTeamMembers:', error)
        toast.error(error instanceof Error ? error.message : 'Error fetching team members')
      }
    }

    fetchTeamMembers()
  }, [router, supabase])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      if (!user.user_metadata?.organization_id) {
        toast.error('Please refresh the page to set up your organization')
        return
      }

      // First, check if the user is already invited
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('email', formData.email)
        .eq('organization_id', user.user_metadata.organization_id)
        .single()

      if (existingMember) {
        toast.error('This user is already a member or has a pending invitation')
        return
      }

      // Send invitation request to our API
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organization_id: user.user_metadata.organization_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      // Add the new member to the local state
      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        ...formData,
        status: 'pending'
      }
      setTeamMembers(prev => [...prev, newMember])

      toast.success('Invitation sent successfully!')
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        role: 'individual_contributor'
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error sending invitation')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'manager':
        return 'Manager'
      case 'individual_contributor':
        return 'Individual Contributor'
      default:
        return role
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Invite team members to collaborate on your projects
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                  style={{backgroundColor: "#121212"}}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                  style={{backgroundColor: "#121212"}}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{backgroundColor: "#121212"}}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number (Optional)</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  style={{backgroundColor: "#121212"}}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="individual_contributor">Individual Contributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Team Members</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {member.first_name.charAt(0).toUpperCase()}
                            {member.last_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.first_name} {member.last_name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleLabel(member.role)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {member.status === 'active' ? 'Active' : 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell>{member.phone_number || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 