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
  const router = useRouter()

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
      } else if (data.user && data.user.email_confirmed_at === undefined && !data.session) {
        // Check if this might be a duplicate signup attempt
        // Try to sign in with the same credentials to see if user already exists
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (loginData.session) {
          // User successfully logged in, meaning they already existed
          alert('An account with this email already exists and you have been signed in.')
          // Clear the form fields after successful login
          setEmail('')
          setPassword('')
          // The session will be automatically set by the auth state change
        } else if (loginError && loginError.message.includes('Email not confirmed')) {
          // User exists but email not confirmed
          setError('An account with this email already exists but is not confirmed. Please check your email for the confirmation link.')
        } else if (loginError && loginError.message.includes('Invalid login credentials')) {
          // User exists but wrong password was provided
          setError('An account with this email already exists. Please use the correct password to sign in, or use "Forgot password?" if needed.')
        } else {
          // Genuinely new user
          setError(null)
          alert('Account created! Check your email for confirmation link.')
        }
      } else if (data.user && data.user.email_confirmed_at) {
        // User already exists and is confirmed - this shouldn't happen in signup
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        // Successful signup
        setError(null)
        alert('Account created! Check your email for confirmation link.')
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

  if (!session) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
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
          />
          <TextField.Root
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
              onClick={handleAuth} 
              disabled={loading || !email || !password}
            >
              {loading ? 'Processing...' : (isSignUpMode ? 'Create Account' : 'Sign In')}
            </Button>
          </Tooltip>
          <Tooltip 
            content={!email.trim() ? "Please enter your email address first" : "Send password reset email"}
          >
            <Button 
              variant="ghost" 
              onClick={handleForgotPassword}
              disabled={resetPasswordLoading || !email.trim()}
              style={{ 
                color: 'var(--gray-11)'
              }}
            >
              {resetPasswordLoading ? 'Sending...' : 'Forgot password?'}
            </Button>
          </Tooltip>
          <Button 
            variant="ghost" 
            onClick={() => setIsSignUpMode(!isSignUpMode)}
          >
            {isSignUpMode 
              ? 'Already have an account? Sign In' 
              : 'Need an account? Create Account'
            }
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
          <br />
          What an empty page here... right?
        </Text>
        {!session.user.user_metadata?.display_name && (
          <Text color="orange" size="2">
            💡 Tip: Set up your display name in the dashboard for a more personalized experience!
          </Text>
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