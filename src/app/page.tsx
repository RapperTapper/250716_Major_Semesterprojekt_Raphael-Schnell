'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button, TextField, Flex, Text, Heading, Container } from '@radix-ui/themes'
import { Session } from '@supabase/supabase-js'
import Link from 'next/link'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [updatingName, setUpdatingName] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSmartAuth = async () => {
    setLoading(true)
    setError(null)

    // First, try to log in
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!loginError) {
      // Login successful
      setLoading(false)
      return
    }

    // If login failed, check if it's because user doesn't exist
    if (loginError.message.includes('Invalid login credentials') || 
        loginError.message.includes('Email not confirmed') ||
        loginError.message.includes('User not found')) {
      
      // Try to sign up the user
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
      } else {
        setError(null)
        alert('Account created! Check your email for confirmation link.')
      }
    } else {
      // Some other login error (wrong password, etc.)
      setError(loginError.message)
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) return
    
    setUpdatingName(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() }
    })

    if (error) {
      setError(error.message)
    } else {
      setDisplayName('')
      // The auth state change will automatically update the session
    }

    setUpdatingName(false)
  }

  if (!session) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
        <Flex direction="column" gap="3">
          <Heading>Welcome</Heading>
          <Text size="2" color="gray">
            Enter your credentials to sign in or create a new account
          </Text>
          <TextField.Root
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField.Root
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button 
            onClick={handleSmartAuth} 
            disabled={loading || !email || !password}
          >
            {loading ? 'Processing...' : 'Continue'}
          </Button>
          {error && <Text color="red">{error}</Text>}
        </Flex>
      </Container>
    )
  }

  return (
    <Container size="1" style={{ paddingTop: '100px' }}>
      <Flex direction="column" gap="3">
        <Heading>🎉 Hello World!</Heading>
        <Text>
          Welcome {session.user.user_metadata?.display_name || session.user.email}! 
          This is your first Next.js app.
        </Text>
        {!session.user.user_metadata?.display_name && (
          <Flex direction="column" gap="2">
            <Text size="2" color="orange">
              Set up your display name for a more personalized experience:
            </Text>
            <Flex gap="2">
              <TextField.Root
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button 
                onClick={handleUpdateDisplayName}
                disabled={updatingName || !displayName.trim()}
                variant="outline"
              >
                {updatingName ? 'Saving...' : 'Save'}
              </Button>
            </Flex>
          </Flex>
        )}
        <Flex gap="2">
          <Link href="/dashboard">
            <Button disabled={!session.user.user_metadata?.display_name}>
              Go to Dashboard
            </Button>
          </Link>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            disabled={!session.user.user_metadata?.display_name}
          >
            Log Out
          </Button>
        </Flex>
      </Flex>
    </Container>
  )
}