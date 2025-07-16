'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button, TextField, Flex, Text, Heading, Container } from '@radix-ui/themes'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have the necessary URL parameters from the email link
    const access_token = searchParams.get('access_token')
    const refresh_token = searchParams.get('refresh_token')
    
    if (!access_token || !refresh_token) {
      setError('Invalid or expired reset link. Please request a new password reset.')
      return
    }

    // Set the session with the tokens from the URL
    supabase.auth.setSession({
      access_token,
      refresh_token
    })
  }, [searchParams])

  const handleResetPassword = async () => {
    setError(null)

    // Validation
    if (!newPassword.trim()) {
      setError('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      
      // Redirect to home page after successful password reset
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
        <Flex direction="column" gap="3" align="center">
          <Heading color="green">Password Reset Successful!</Heading>
          <Text size="2" color="green" style={{ textAlign: 'center' }}>
            Your password has been updated successfully. You will be redirected to the login page shortly.
          </Text>
          <Text size="1" color="gray">
            Redirecting in 2 seconds...
          </Text>
        </Flex>
      </Container>
    )
  }

  return (
    <Container size="1" style={{ paddingTop: '100px' }}>
      <Flex direction="column" gap="3">
        <Heading>Reset Your Password</Heading>
        <Text size="2" color="gray">
          Enter your new password below. Make sure it's secure and easy for you to remember.
        </Text>
        
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium">New Password</Text>
          <TextField.Root
            type="password"
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text size="2" weight="medium">Confirm New Password</Text>
          <TextField.Root
            type="password"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Flex>

        <Button 
          onClick={handleResetPassword}
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? 'Updating Password...' : 'Update Password'}
        </Button>

        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          disabled={loading}
        >
          Back to Login
        </Button>

        {error && (
          <Text color="red" size="2">
            {error}
          </Text>
        )}

        <Text size="1" color="gray" style={{ textAlign: 'center' }}>
          💡 Choose a strong password with at least 6 characters
        </Text>
      </Flex>
    </Container>
  )
}
