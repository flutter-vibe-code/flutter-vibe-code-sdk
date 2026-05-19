'use client'

// Convex Team Selector Component
// Allows user to select which Convex team to use

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ConvexTeam {
  id: string
  name: string
  slug: string
  referralCode?: string
}

interface ConvexTeamSelectorProps {
  value: string
  onChange: (teamSlug: string) => void
}

export function ConvexTeamSelector({ value, onChange }: ConvexTeamSelectorProps) {
  const [teams, setTeams] = useState<ConvexTeam[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // For now, we'll hardcode a default team
    // In a full implementation, you'd fetch this from the Convex API
    // after the user has authenticated with OAuth
    const defaultTeams: ConvexTeam[] = [
      {
        id: '1',
        name: 'Personal Team',
        slug: 'personal',
      },
    ]
    setTeams(defaultTeams)

    // Auto-select first team if none selected
    if (!value && defaultTeams.length > 0) {
      onChange(defaultTeams[0].slug)
    }
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="team-select" className="text-sm font-medium">
        Convex Team
      </label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger id="team-select">
          <SelectValue placeholder="Select a team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.slug}>
              {team.name}
            </SelectItem>
          ))}
          {teams.length === 0 && (
            <SelectItem value="" disabled>
              No teams available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Your Convex project will be created in this team.
      </p>
    </div>
  )
}
