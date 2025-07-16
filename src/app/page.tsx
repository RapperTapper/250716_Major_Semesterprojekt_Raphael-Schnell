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
  const [isSignUp, setIsSignUp] = useState(false)

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

  const handleAuth = async () => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        setError(null)
        alert('Check your email for confirmation link!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        setError(null)
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (!session) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
        <Flex direction="column" gap="3">
          <Heading>{isSignUp ? 'Sign Up' : 'Login'}</Heading>
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
          <Button onClick={handleAuth}>
            {isSignUp ? 'Sign Up' : 'Log In'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
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
          <Text color="orange" size="2">
            💡 Tip: Set up your display name in the dashboard for a more personalized experience!
          </Text>
        )}
        <Flex gap="2">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Button onClick={handleLogout} variant="outline">Log Out</Button>
        </Flex>
      </Flex>
    </Container>
  )
}