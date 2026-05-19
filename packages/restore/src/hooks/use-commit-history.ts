'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Commit, GitCommitsResponse } from '../types'

interface UseCommitHistoryOptions {
  projectId?: string
  sandboxId?: string
  userId?: string
  /** Custom API endpoint (defaults to /api/git-commits) */
  apiEndpoint?: string
}

interface UseCommitHistoryResult {
  commits: Commit[]
  error: Error | null
  isLoading: boolean
  isFetching: boolean
  refetch: () => Promise<void>
}

async function fetchCommits(
  projectId: string,
  sandboxId: string,
  userId: string,
  apiEndpoint: string = '/api/git-commits'
): Promise<Commit[]> {
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      sandboxId,
      userID: userId,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch commits')
  }

  const data: GitCommitsResponse = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch commits')
  }

  return data.commits || []
}

export function useCommitHistory({
  projectId,
  sandboxId,
  userId,
  apiEndpoint,
}: UseCommitHistoryOptions): UseCommitHistoryResult {
  const queryClient = useQueryClient()

  const { data, error, isLoading, isFetching, refetch: queryRefetch } = useQuery({
    queryKey: ['commits', projectId, sandboxId, userId],
    queryFn: () => fetchCommits(projectId!, sandboxId!, userId!, apiEndpoint),
    enabled: !!(projectId && sandboxId && userId),
    staleTime: 30 * 1000, // Data is fresh for 30 seconds
    refetchOnWindowFocus: true, // Automatically refetch when tab is focused
  })

  const refetch = async () => {
    await queryRefetch()
  }

  return {
    commits: data || [],
    error: error as Error | null,
    isLoading,
    isFetching,
    refetch,
  }
}
