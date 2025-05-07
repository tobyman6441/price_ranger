'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

  useEffect(() => {
    // Load team members from localStorage
    const savedTeamMembers = JSON.parse(localStorage.getItem('team_members') || '[]')
    setTeamMembers(savedTeamMembers)
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      // if (!user.email) {
      //   router.push('/login')
      //   return
      // }

      // Check if the user is already invited
      const existingMember = teamMembers.find(member => member.email === formData.email)
      if (existingMember) {
        toast.error('This user is already a member or has a pending invitation')
        return
      }

      // Create new team member
      const newMember: TeamMember = {
        id: crypto.randomUUID(),
        ...formData,
        status: 'pending'
      }

      // Update local storage
      const updatedTeamMembers = [...teamMembers, newMember]
      localStorage.setItem('team_members', JSON.stringify(updatedTeamMembers))
      setTeamMembers(updatedTeamMembers)

      toast.success('Invitation sent successfully!')
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        role: 'individual_contributor'
      })
    } catch (error) {
      toast.error('Error sending invitation')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-4">Team Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
            <CardDescription>Send invitations to your team members</CardDescription>
          </CardHeader>
          <form onSubmit={handleInvite}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
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
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {member.first_name[0]}
                        {member.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 