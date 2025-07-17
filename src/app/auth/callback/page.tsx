'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Container, Flex, Text, Heading, Spinner } from '@radix-ui/themes'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the auth code from URL parameters
        const code = searchParams.get('code')
        
        if (code) {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Auth callback error:', error)
            setError(error.message)
            setLoading(false)
            return
          }

          if (data.session) {
            // Successfully authenticated
            console.log('User authenticated successfully')
            router.push('/')
          } else {
            setError('No session created')
            setLoading(false)
          }
        } else {
          // Handle hash-based tokens (fallback for older flows)
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Session error:', error)
            setError(error.message)
          } else if (data.session) {
            router.push('/')
          } else {
            setError('No authentication code found')
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  if (loading) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
        <Flex direction="column" align="center" gap="3">
          <Spinner size="3" />
          <Heading>Confirming your account...</Heading>
          <Text color="gray">Please wait while we verify your email.</Text>
        </Flex>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
        <Flex direction="column" align="center" gap="3">
          <Heading color="red">Authentication Error</Heading>
          <Text color="red">{error}</Text>
          <Text color="gray">
            Please try signing in again or contact support if the problem persists.
          </Text>
          <button 
            onClick={() => router.push('/')}
            style={{ 
              padding: '8px 16px', 
              background: 'var(--accent-9)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Back to Sign In
          </button>
        </Flex>
      </Container>
    )
  }

  return null
}
