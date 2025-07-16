'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button, TextField, Flex, Text, Heading, Container } from '@radix-ui/themes'
import { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

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

  const handleLogin = async () => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (!session) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
        <Flex direction="column" gap="3">
          <Heading>Login</Heading>
          <TextField.Root>
            <TextField.Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </TextField.Root>
          <TextField.Root>
            <TextField.Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </TextField.Root>
          <Button onClick={handleLogin}>Log In</Button>
          {error && <Text color="red">{error}</Text>}
        </Flex>
      </Container>
    )
  }

  return (
    <Container size="1" style={{ paddingTop: '100px' }}>
      <Flex direction="column" gap="3">
        <Heading>Welcome!</Heading>
        <Text>You are logged in as {session.user.email}</Text>
        <Button onClick={handleLogout}>Log Out</Button>
      </Flex>
    </Container>
  )
}