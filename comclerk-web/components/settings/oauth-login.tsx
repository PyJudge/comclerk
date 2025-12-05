'use client'

import { useState } from 'react'
import { useProviderAuthMethods, useOAuthAuthorize, useOAuthCallback, useConnectedProviders, useProviderLogout } from '@/hooks'
import { cn } from '@/lib/utils'

const PROVIDER_ICONS: Record<string, string> = {
  anthropic: 'A',
  openai: 'O',
}

const PROVIDER_NAMES: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI (Codex)',
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'bg-orange-500',
  openai: 'bg-emerald-600',
}

// GitHub Copilot은 사용하지 않으므로 UI에서 숨김
const HIDDEN_PROVIDERS = ['github-copilot', 'github-copilot-enterprise']

interface OAuthState {
  providerId: string
  methodIndex: number
  url: string
  method: 'auto' | 'code'
  instructions: string
}

export function OAuthLogin() {
  const { data: authMethods, isLoading: authLoading } = useProviderAuthMethods()
  const { data: connectedProviders = [] } = useConnectedProviders()
  const oauthAuthorize = useOAuthAuthorize()
  const oauthCallback = useOAuthCallback()
  const providerLogout = useProviderLogout()

  const [oauthState, setOauthState] = useState<OAuthState | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logoutProviderId, setLogoutProviderId] = useState<string | null>(null)

  const handleOAuthStart = async (providerId: string, methodIndex: number) => {
    setError(null)
    setSuccess(null)

    try {
      const result = await oauthAuthorize.mutateAsync({ providerId, methodIndex })
      if (result) {
        setOauthState({
          providerId,
          methodIndex,
          url: result.url,
          method: result.method,
          instructions: result.instructions,
        })

        // Open the OAuth URL in a new window
        window.open(result.url, '_blank', 'width=600,height=700')

        // For 'auto' method, poll for completion
        if (result.method === 'auto') {
          // Wait for the OAuth to complete and call callback
          const checkInterval = setInterval(async () => {
            try {
              await oauthCallback.mutateAsync({
                providerId,
                methodIndex,
              })
              clearInterval(checkInterval)
              setOauthState(null)
              setSuccess(`Successfully connected to ${PROVIDER_NAMES[providerId] || providerId}!`)
            } catch (e) {
              // OauthMissing 또는 치명적 에러면 폴링 중지
              const errorMsg = e instanceof Error ? e.message : String(e)
              if (errorMsg.includes('OauthMissing') || errorMsg.includes('Missing') || errorMsg.includes('Failed')) {
                clearInterval(checkInterval)
                setOauthState(null)
                setError('OAuth session expired. Please try again.')
              }
              // 그 외 에러는 계속 폴링 (아직 pending 상태일 수 있음)
            }
          }, 2000)

          // Clear interval after 5 minutes
          setTimeout(() => {
            clearInterval(checkInterval)
            if (oauthState?.providerId === providerId) {
              setOauthState(null)
              setError('OAuth timed out. Please try again.')
            }
          }, 300000)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start OAuth flow')
    }
  }

  const handleCodeSubmit = async () => {
    if (!oauthState || !manualCode.trim()) return

    setError(null)
    try {
      await oauthCallback.mutateAsync({
        providerId: oauthState.providerId,
        methodIndex: oauthState.methodIndex,
        code: manualCode.trim(),
      })
      setOauthState(null)
      setManualCode('')
      setSuccess(`Successfully connected to ${PROVIDER_NAMES[oauthState.providerId] || oauthState.providerId}!`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete OAuth flow')
    }
  }

  const handleCancel = () => {
    setOauthState(null)
    setManualCode('')
    setError(null)
  }

  const handleLogout = async (providerId: string) => {
    setError(null)
    setSuccess(null)
    setLogoutProviderId(providerId)
    try {
      await providerLogout.mutateAsync(providerId)
      setSuccess(`Successfully disconnected from ${PROVIDER_NAMES[providerId] || providerId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to logout')
    } finally {
      setLogoutProviderId(null)
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Connect with OAuth</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!authMethods || Object.keys(authMethods).length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Connect with OAuth</h3>
        <p className="text-muted-foreground">No OAuth providers available.</p>
      </div>
    )
  }

  // If in the middle of OAuth flow with code entry
  if (oauthState && oauthState.method === 'code') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Enter Authorization Code</h3>
        <div className="p-4 rounded-lg border bg-card space-y-4">
          <p className="text-sm text-muted-foreground">{oauthState.instructions}</p>
          <div className="space-y-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste authorization code here"
              className="w-full px-3 py-2 rounded-md border bg-background"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCodeSubmit}
                disabled={!manualCode.trim() || oauthCallback.isPending}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {oauthCallback.isPending ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={handleCancel}
                className="py-2 px-4 rounded-md border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  // If in the middle of auto OAuth flow
  if (oauthState && oauthState.method === 'auto') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Completing Authentication...</h3>
        <div className="p-4 rounded-lg border bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">
              Complete the authentication in the opened window...
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{oauthState.instructions}</p>
          <button
            onClick={handleCancel}
            className="py-2 px-4 rounded-md border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Connect with OAuth</h3>
      <p className="text-sm text-muted-foreground">
        Sign in with your subscription to use AI models without an API key.
      </p>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-green-500/10 text-green-500 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(authMethods)
          .filter(([providerId]) => !HIDDEN_PROVIDERS.includes(providerId))
          .map(([providerId, methods]) => {
          const oauthMethods = methods.filter((m) => m.type === 'oauth')
          if (oauthMethods.length === 0) return null

          return (
            <div
              key={providerId}
              className="p-4 rounded-lg border bg-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold',
                      PROVIDER_COLORS[providerId] || 'bg-gray-500'
                    )}
                  >
                    {PROVIDER_ICONS[providerId] || providerId[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium">{PROVIDER_NAMES[providerId] || providerId}</h4>
                    <p className="text-xs text-muted-foreground">
                      {connectedProviders.includes(providerId) ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {connectedProviders.includes(providerId) && (
                  <button
                    onClick={() => handleLogout(providerId)}
                    disabled={logoutProviderId === providerId}
                    className={cn(
                      'text-sm px-3 py-1.5 rounded-md',
                      'text-destructive border border-destructive/30',
                      'hover:bg-destructive/10 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {logoutProviderId === providerId ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {oauthMethods.map((method, index) => {
                  const actualIndex = methods.findIndex((m) => m === method)
                  return (
                    <button
                      key={index}
                      onClick={() => handleOAuthStart(providerId, actualIndex)}
                      disabled={oauthAuthorize.isPending}
                      className={cn(
                        'w-full py-2.5 px-4 rounded-md',
                        'border hover:bg-muted transition-colors',
                        'flex items-center justify-center gap-2',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      {method.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
