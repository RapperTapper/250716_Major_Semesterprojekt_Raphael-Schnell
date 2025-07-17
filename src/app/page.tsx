'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button, TextField, Flex, Text, Heading, Container, Tooltip } from '@radix-ui/themes'
import { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [saveDisplayNameLoading, setSaveDisplayNameLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session)
      setSession(session)
      
      // Handle successful sign-in after email confirmation
      if (event === 'SIGNED_IN' && session) {
        setError(null)
        setEmail('')
        setPassword('')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuth = async () => {
    setLoading(true)
    setError(null)

    if (isSignUpMode) {
      // Sign up mode
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        // Check if the error is due to existing account
        if (error.message.includes('already registered') || 
            error.message.includes('already been registered') ||
            error.message.includes('already exists') ||
            error.message.includes('User already registered') ||
            error.message.includes('already in use') ||
            error.message.includes('duplicate')) {
          setError('An account with this email already exists. Please sign in instead or use a different email address.')
        } else {
          setError(error.message)
        }
      } else if (data.user) {
        // User was created successfully
        if (data.session) {
          // User is immediately signed in (email confirmation disabled)
          setError(null)
          setEmail('')
          setPassword('')
          alert('Account created and signed in successfully!')
        } else {
          // User created but needs email confirmation
          setError(null)
          alert('Account created! Please check your email for the confirmation link before signing in.')
          // Clear form fields
          setEmail('')
          setPassword('')
        }
      } else {
        // Unexpected case
        setError('Something went wrong during account creation. Please try again.')
      }
    } else {
      // Login mode
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in.')
        } else {
          setError(error.message)
        }
      } else {
        // Successful login - clear form fields
        setEmail('')
        setPassword('')
      }
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email && password && !loading) {
      e.preventDefault()
      handleAuth()
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Explicitly redirect to home page (login page)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first')
      return
    }

    setResetPasswordLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      alert('Password reset email sent! Check your inbox for instructions.')
    }

    setResetPasswordLoading(false)
  }

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name')
      return
    }

    setSaveDisplayNameLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() }
    })

    if (error) {
      setError(error.message)
    } else {
      // Clear the input field after successful save
      setDisplayName('')
      alert('Display name saved successfully!')
    }

    setSaveDisplayNameLoading(false)
  }

  if (!session) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
        <form onSubmit={(e) => { e.preventDefault(); if (email && password && !loading) handleAuth(); }}>
          <Flex direction="column" gap="3">
            <Heading>{isSignUpMode ? 'Create Account' : 'Welcome Back'}</Heading>
            <Text size="2" color="gray">
              {isSignUpMode 
                ? 'Enter your details to create a new account' 
                : 'Enter your credentials to sign in'
              }
            </Text>
            <TextField.Root
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="email"
              autoFocus
              tabIndex={1}
            />
            <TextField.Root
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete={isSignUpMode ? "new-password" : "current-password"}
              tabIndex={2}
            />
            <Tooltip 
              content={
                !email.trim() && !password.trim() 
                  ? "Please enter both email and password" 
                  : !email.trim() 
                  ? "Please enter your email address" 
                  : !password.trim() 
                  ? "Please enter a password" 
                  : isSignUpMode 
                  ? "Create your new account" 
                  : "Sign in to your account"
              }
            >
              <Button 
                type="submit"
                onClick={handleAuth} 
                disabled={loading || !email || !password}
                tabIndex={3}
              >
                {loading ? 'Processing...' : (isSignUpMode ? 'Create Account' : 'Sign In')}
              </Button>
            </Tooltip>
            <Tooltip 
              content={!email.trim() ? "Please enter your email address first" : "Send password reset email"}
            >
              <Button 
                type="button"
                variant="ghost" 
                onClick={handleForgotPassword}
                disabled={resetPasswordLoading || !email.trim()}
                tabIndex={4}
                style={{ 
                  color: 'var(--gray-11)'
                }}
              >
                {resetPasswordLoading ? 'Sending...' : 'Forgot password?'}
              </Button>
            </Tooltip>
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setIsSignUpMode(!isSignUpMode)}
              tabIndex={5}
            >
              {isSignUpMode 
                ? 'Already have an account? Sign In' 
                : 'Need an account? Create Account'
              }
            </Button>
            {error && <Text color="red">{error}</Text>}
          </Flex>
        </form>
      </Container>
    )
  }

  return (
    <Container size="1" style={{ paddingTop: '100px' }}>
      <Flex direction="column" gap="3">
        <Heading>🎉 You are in!</Heading>
        <Text>
          Welcome <strong>{session.user.user_metadata?.display_name || session.user.email}</strong>
          <br />
          What an empty page... right?
          <br />
          Let&apos;s change that!
        </Text>
        {!session.user.user_metadata?.display_name && (
          <Flex direction="column" gap="2" style={{ marginBottom: '16px' }}>
            <Text color="orange" size="2">
              💡 Please set up your display name to access the dashboard:
            </Text>
            <Flex gap="2" align="end">
              <TextField.Root
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && displayName.trim() && !saveDisplayNameLoading) {
                    e.preventDefault()
                    handleSaveDisplayName()
                  }
                }}
                style={{ flex: 1 }}
                tabIndex={1}
              />
              <Button 
                onClick={handleSaveDisplayName}
                disabled={saveDisplayNameLoading || !displayName.trim()}
                tabIndex={2}
              >
                {saveDisplayNameLoading ? 'Saving...' : 'Save'}
              </Button>
            </Flex>
          </Flex>
        )}
        {!session.user.user_metadata?.display_name && (
          <Text color="orange" size="2">
            💡 Tip: Set up your display name in the dashboard for a more personalized experience!
          </Text>
        )}
        <Flex gap="2">
          <Link href="/dashboard">
            <Button 
              disabled={!session.user.user_metadata?.display_name}
              tabIndex={session.user.user_metadata?.display_name ? 1 : 3}
            >
              Go to Dashboard
            </Button>
          </Link>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            disabled={!session.user.user_metadata?.display_name}
            tabIndex={session.user.user_metadata?.display_name ? 2 : 4}
          >
            Log Out
          </Button>
        </Flex>
        {error && <Text color="red">{error}</Text>}
      </Flex>
    </Container>
  )
}