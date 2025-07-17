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
      // Check if user already exists before attempting signup
      console.log('🔍 Checking if user already exists...')
      
      // Try to sign in first to check if user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInData.user && !signInError) {
        // User exists and credentials are correct
        console.log('🚨 USER ALREADY EXISTS - successful sign in')
        setError('This email is already registered. You have been signed in instead.')
        setEmail('')
        setPassword('')
        setLoading(false)
        return
      }

      if (signInError && !signInError.message.includes('Invalid login credentials')) {
        // Some other error occurred (like email not confirmed)
        if (signInError.message.includes('Email not confirmed')) {
          console.log('🚨 USER EXISTS BUT EMAIL NOT CONFIRMED')
          setError('This email is already registered but not confirmed. Please check your email for the confirmation link, or contact support if you need a new confirmation email.')
        } else {
          console.log('🚨 USER EXISTS - other sign in error:', signInError.message)
          setError('This email is already in use. Please sign in instead or use a different email address.')
        }
        setLoading(false)
        return
      }

      // If we reach here, either user doesn't exist OR credentials are wrong
      // Now attempt signup
      console.log('👤 Attempting signup for potentially new user...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.log('Supabase signUp error:', error)
        console.log('Error message:', error.message)
        console.log('Error status:', error.status)
        console.log('Error name:', error.name)
        
        // Check for password-related errors first
        if (error.message.includes('Password should be at least') ||
            error.message.includes('password') ||
            error.message.includes('Password') ||
            error.message.includes('weak password') ||
            error.message.includes('too short') ||
            error.message.includes('must contain')) {
          setError(error.message)
        }
        // Check for specific error messages that indicate user already exists
        else if (error.message.includes('User already registered') || 
            error.message.includes('already registered') ||
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.status === 422) {
          setError('This email is already registered. Please sign in instead, or use "Forgot password?" if needed.')
        } else {
          setError(error.message)
        }
      } else if (data.user) {
        console.log('=== ANALYZING SIGNUP RESPONSE ===')
        console.log('User ID:', data.user.id)
        console.log('User email:', data.user.email)
        console.log('Created at:', data.user.created_at)
        console.log('Email confirmed at:', data.user.email_confirmed_at)
        console.log('Last sign in at:', data.user.last_sign_in_at)
        console.log('Confirmation sent at:', data.user.confirmation_sent_at)
        console.log('Session:', data.session ? 'Present' : 'Null')
        
        // Simpler, more reliable detection:
        // 1. If there's a session, user was created and signed in immediately
        // 2. If no session but confirmation_sent_at exists, it's a genuine new user needing confirmation
        // 3. The key insight: Supabase will NOT send a confirmation email for existing users
        //    during signup attempts, even if it returns user data
        // 4. HOWEVER: When existing user + wrong password, Supabase returns fake data with 
        //    identical created_at and confirmation_sent_at timestamps
        
        const createdAt = data.user.created_at
        const confirmationSentAt = data.user.confirmation_sent_at
        
        // Check if timestamps are identical (indicates fake Supabase response for existing user)
        const areTimestampsIdentical = createdAt === confirmationSentAt
        
        console.log('Created at:', createdAt)
        console.log('Confirmation sent at:', confirmationSentAt)
        console.log('Timestamps identical:', areTimestampsIdentical)
        
        if (data.session) {
          // User is immediately signed in - genuinely new with instant confirmation
          setError(null)
          setEmail('')
          setPassword('')
          console.log('🎉 New user created and signed in immediately')
          alert('Account created and signed in successfully!')
        } else if (areTimestampsIdentical) {
          // Identical timestamps = existing user, Supabase fake response
          console.log('🚨 EXISTING USER: Identical timestamps detected - fake Supabase response')
          setError('This email is already registered. Please sign in instead, or use "Forgot password?" if needed.')
        } else if (data.user.confirmation_sent_at && 
                   !data.user.email_confirmed_at && 
                   !data.user.last_sign_in_at) {
          // User created and confirmation email was sent - genuinely new
          setError(null)
          console.log('📧 New user created, confirmation email sent')
          alert('Account created! Please check your email for the confirmation link before signing in.')
          setEmail('')
          setPassword('')
        } else {
          // Fallback: if we can't determine clearly, assume existing user
          console.log('🚨 AMBIGUOUS: Treating as existing user for safety')
          setError('This email is already registered. Please sign in instead, or use "Forgot password?" if needed.')
        }
      } else {
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
      // Check if the error indicates no user found
      if (error.message.includes('User not found') || 
          error.message.includes('No user found') ||
          error.message.includes('not found') ||
          error.message.includes('Invalid email') ||
          error.message.includes('does not exist')) {
        setError('No account found with the provided email address. Please check your email or create a new account.')
      } else {
        setError(error.message)
      }
    } else {
      alert('If an account with that email exists, a password reset link has been sent. Please check your inbox for further instructions.')
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
      // alert('Display name saved successfully!')
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