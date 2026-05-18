'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface TunnelHealthState {
  primaryPort: 8081
  tunnelStatus: {
    [port: number]: 'connected' | 'disconnected' | 'unknown'
  }
  isRecoveryActive: boolean
  isStartingRecovery: boolean
  lastHealthCheck: Date | null
}

interface UseCloudflareTunnelCheckOptions {
  sandboxId: string | null
  projectId: string | null
  userId: string | null
  tunnelUrl: string | null
  enabled?: boolean
  serverReady?: boolean // Only start health checks after initial server setup is complete
  pollingInterval?: number // Default: 60000ms (60 seconds)
  onBackupServerReady?: (newSandboxUrl: string, newcloudflareUrl: string) => void // Callback when backup server starts with new URL
  onExpoError?: (errorMessage: string) => void // Callback when Flutter app has a build error
  tunnelMode?: string // 'cloudflare-patch' or 'lan'
}

interface UseCloudflareTunnelCheckReturn {
  healthState: TunnelHealthState
  isTunnelHealthy: boolean
  isBackupActive: boolean
  isStartingBackup: boolean
  isRecoveryActive: boolean
  isInRecoveryCooldown: () => boolean
  checkTunnelHealth: () => Promise<boolean>
  triggerBackupServer: () => Promise<void>
}

const PRIMARY_PORT = 8081
const DEFAULT_POLLING_INTERVAL = 60000 // 60 seconds
const RECOVERY_COOLDOWN_MS = 90000 // 90 seconds

const RECOVERY_TOAST_ID = 'tunnel-recovery'

export function useCloudflareTunnelCheck({
  sandboxId,
  projectId,
  userId,
  tunnelUrl,
  enabled = true,
  serverReady = false,
  pollingInterval = DEFAULT_POLLING_INTERVAL,
  onBackupServerReady,
  onExpoError,
  tunnelMode = 'cloudflare-patch',
}: UseCloudflareTunnelCheckOptions): UseCloudflareTunnelCheckReturn {
  const [healthState, setHealthState] = useState<TunnelHealthState>({
    primaryPort: PRIMARY_PORT,
    tunnelStatus: {
      [PRIMARY_PORT]: 'unknown',
    },
    isRecoveryActive: false,
    isStartingRecovery: false,
    lastHealthCheck: null,
  })

  const isCheckingRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const consecutiveFailuresRef = useRef(0)

  // Recovery coordination refs (US-001)
  const recoveryLockRef = useRef(false)
  const lastRecoveryTimestampRef = useRef(0)

  // Stale closure fix refs (US-007) — always read latest URL values
  const tunnelUrlRef = useRef(tunnelUrl)
  const sandboxIdRef = useRef(sandboxId)
  tunnelUrlRef.current = tunnelUrl
  sandboxIdRef.current = sandboxId

  const isDev = process.env.NODE_ENV === 'development'

  const isInRecoveryCooldown = useCallback((): boolean => {
    if (lastRecoveryTimestampRef.current === 0) return false
    return Date.now() - lastRecoveryTimestampRef.current < RECOVERY_COOLDOWN_MS
  }, [])

  const showDevToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    if (!isDev) return

    switch (type) {
      case 'success':
        toast.success(message)
        break
      case 'warning':
        toast.warning(message)
        break
      case 'error':
        toast.error(message)
        break
      default:
        toast.info(message)
    }
  }, [isDev])

  const checkTunnelHealth = useCallback(async (): Promise<boolean> => {
    // Use refs to avoid stale closures (US-007)
    const currentcloudflareUrl = tunnelUrlRef.current
    const currentSandboxId = sandboxIdRef.current

    if (!currentSandboxId || !currentcloudflareUrl || isCheckingRef.current) {
      return true // Assume healthy if we can't check
    }

    // Skip during recovery or cooldown (US-001)
    if (recoveryLockRef.current || isInRecoveryCooldown()) {
      console.log('[useCloudflareTunnelCheck] Skipping health check — recovery active or in cooldown')
      return true
    }

    isCheckingRef.current = true

    try {
      console.log('[useCloudflareTunnelCheck] Checking cloudflare health...')

      const checkPort = PRIMARY_PORT

      const response = await fetch('/api/check-tunnel-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tunnelUrl: currentcloudflareUrl,
          sandboxId: currentSandboxId,
          checkPort,
        }),
      })

      const data = await response.json()
      console.log('[useCloudflareTunnelCheck] Health check result:', data)

      setHealthState(prev => ({
        ...prev,
        lastHealthCheck: new Date(),
        tunnelStatus: {
          ...prev.tunnelStatus,
          [PRIMARY_PORT]: data.tunnelStatus,
        },
      }))

      // If the health check detected an Expo error page, notify the caller
      if (data.expoError && onExpoError) {
        console.log('[useCloudflareTunnelCheck] Expo error detected:', data.expoError.substring(0, 100))
        onExpoError(data.expoError)
      }

      if (data.isAlive) {
        consecutiveFailuresRef.current = 0
        return true
      } else {
        consecutiveFailuresRef.current++
        return false
      }
    } catch (error) {
      console.error('[useCloudflareTunnelCheck] Health check failed:', error)
      consecutiveFailuresRef.current++
      return false
    } finally {
      isCheckingRef.current = false
    }
  }, [tunnelMode, onExpoError, isInRecoveryCooldown])

  const triggerBackupServer = useCallback(async () => {
    const currentSandboxId = sandboxIdRef.current
    if (!currentSandboxId || !projectId || !userId) {
      console.error('[useCloudflareTunnelCheck] Cannot start backup: missing required params')
      return
    }

    // Acquire recovery lock (US-001)
    if (recoveryLockRef.current) {
      console.log('[useCloudflareTunnelCheck] Recovery already in progress, skipping')
      return
    }
    recoveryLockRef.current = true

    setHealthState(prev => ({ ...prev, isStartingRecovery: true }))

    // Single toast at start of recovery (US-006)
    toast.info('Reconnecting tunnel...', { id: RECOVERY_TOAST_ID })

    try {
      console.log('[useCloudflareTunnelCheck] Restarting server...')

      const action = healthState.isRecoveryActive ? 'cleanup_and_restart' : 'start_backup'

      const response = await fetch('/api/tunnel-backup-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sandboxId: currentSandboxId,
          projectId,
          userId,
          action,
          tunnelMode,
        }),
      })

      const data = await response.json()
      console.log('[useCloudflareTunnelCheck] Backup server response:', data)

      if (data.success) {
        setHealthState(prev => ({
          ...prev,
          isRecoveryActive: true,
          isStartingRecovery: false,
          tunnelStatus: {
            ...prev.tunnelStatus,
            [PRIMARY_PORT]: 'connected',
          },
        }))
        consecutiveFailuresRef.current = 0

        // Update refs immediately with new URLs (US-007)
        if (data.tunnelUrl) {
          tunnelUrlRef.current = data.tunnelUrl
        }

        // Set recovery timestamp for cooldown (US-001)
        lastRecoveryTimestampRef.current = Date.now()

        // Single success toast (US-006)
        toast.success('Preview reconnected', { id: RECOVERY_TOAST_ID })

        // Call callback with new URLs so parent component can update preview
        if (onBackupServerReady && data.sandboxUrl && data.tunnelUrl) {
          console.log('[useCloudflareTunnelCheck] Calling onBackupServerReady with new URLs:', data.sandboxUrl, data.tunnelUrl)
          onBackupServerReady(data.sandboxUrl, data.tunnelUrl)
        }
      } else {
        setHealthState(prev => ({ ...prev, isStartingRecovery: false }))

        // Single error toast (US-006)
        toast.error('Recovery failed. Please refresh the page.', { id: RECOVERY_TOAST_ID })
      }
    } catch (error) {
      console.error('[useCloudflareTunnelCheck] Failed to restart server:', error)
      setHealthState(prev => ({ ...prev, isStartingRecovery: false }))

      toast.error('Recovery failed. Please refresh the page.', { id: RECOVERY_TOAST_ID })
    } finally {
      // Release recovery lock (US-001)
      recoveryLockRef.current = false
    }
  }, [projectId, userId, healthState.isRecoveryActive, onBackupServerReady, tunnelMode])

  // Main polling effect - only starts after serverReady is true
  useEffect(() => {
    // Don't start polling until initial server setup is complete
    // In LAN mode, skip cloudflare health checks entirely — there's no cloudflare tunnel to monitor
    if (!enabled || !sandboxId || !tunnelUrl || !serverReady || tunnelMode === 'lan') {
      if (tunnelMode === 'lan') {
        console.log('[useCloudflareTunnelCheck] LAN mode active, skipping cloudflare health checks')
      } else if (!serverReady && enabled && sandboxId && tunnelUrl) {
        console.log('[useCloudflareTunnelCheck] Waiting for initial server setup to complete before starting health checks...')
      }
      return
    }

    const performHealthCheck = async () => {
      const isHealthy = await checkTunnelHealth()

      if (!isHealthy && !healthState.isStartingRecovery) {
        console.log('[useCloudflareTunnelCheck] cloudflare unhealthy, consecutive failures:', consecutiveFailuresRef.current)

        // Trigger backup after 3 consecutive failures to avoid false positives
        if (consecutiveFailuresRef.current >= 3) {
          await triggerBackupServer()
        }
      }
    }

    // Initial check after server is ready - wait 60 seconds before first check
    // to give the initial cloudflare connection time to stabilize
    const initialTimeout = setTimeout(() => {
      console.log('[useCloudflareTunnelCheck] Initial server setup complete, starting first health check...')
      performHealthCheck()
    }, pollingInterval) // Wait one full polling interval before first check

    // Set up polling interval
    intervalRef.current = setInterval(performHealthCheck, pollingInterval)

    console.log(`[useCloudflareTunnelCheck] Server ready - started polling every ${pollingInterval}ms (first check in ${pollingInterval}ms)`)

    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      console.log('[useCloudflareTunnelCheck] Stopped polling')
    }
  }, [enabled, sandboxId, tunnelUrl, serverReady, pollingInterval, checkTunnelHealth, triggerBackupServer, healthState.isStartingRecovery, tunnelMode])

  const isTunnelHealthy = healthState.tunnelStatus[PRIMARY_PORT] === 'connected'

  return {
    healthState,
    isTunnelHealthy,
    isBackupActive: healthState.isRecoveryActive,
    isStartingBackup: healthState.isStartingRecovery,
    isRecoveryActive: recoveryLockRef.current || healthState.isStartingRecovery,
    isInRecoveryCooldown,
    checkTunnelHealth,
    triggerBackupServer,
  }
}
