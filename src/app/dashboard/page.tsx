'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button, Flex, Text, Heading, Container, Card, TextField } from '@radix-ui/themes'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Pencil1Icon } from '@radix-ui/react-icons'

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editEmail, setEditEmail] = useState('')
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [emailChangeRequested, setEmailChangeRequested] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      
      if (session) {
        // Set initial values for editing
        setEditEmail(session.user.email || '')
        setEditDisplayName(session.user.user_metadata?.display_name || '')
      } else {
        // Redirect to home if not authenticated
        router.push('/')
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      
      if (session) {
        setEditEmail(session.user.email || '')
        setEditDisplayName(session.user.user_metadata?.display_name || '')
      } else {
        // Redirect to home if user logs out
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // The auth state change listener will handle the redirect
  }

  const handleEditProfile = () => {
    setIsEditing(true)
    setUpdateError(null)
    setUpdateSuccess(false)
    setEmailChangeRequested(false)
    setPendingEmail(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset to current values
    if (session) {
      setEditEmail(session.user.email || '')
      setEditDisplayName(session.user.user_metadata?.display_name || '')
    }
    setEditPassword('') // Reset password field
    setUpdateError(null)
    setUpdateSuccess(false)
    setEmailChangeRequested(false)
    setPendingEmail(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editDisplayName.trim() && !updateLoading) {
      e.preventDefault()
      handleSaveProfile()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleSaveProfile = async () => {
    if (!session) return

    // Prevent saving if display name is empty
    if (!editDisplayName.trim()) {
      setUpdateError('Display name cannot be empty')
      return
    }

    setUpdateLoading(true)
    setUpdateError(null)
    setUpdateSuccess(false)
    setEmailChangeRequested(false)

    try {
      let emailChanged = false
      
      // Update email if changed
      if (editEmail !== session.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editEmail
        })
        
        if (emailError) {
          throw emailError
        }
        
        emailChanged = true
        setPendingEmail(editEmail)
        setEmailChangeRequested(true)
      }

      // Update display name (stored in user metadata)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          display_name: editDisplayName
        }
      })

      if (metadataError) {
        throw metadataError
      }

      // Update password if provided
      if (editPassword.trim()) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: editPassword
        })

        if (passwordError) {
          throw passwordError
        }
      }

      if (emailChanged) {
        // Don't set updateSuccess immediately for email changes
        setIsEditing(false)
        // Reset email field to current email since change is pending
        setEditEmail(session.user.email || '')
        setEditPassword('') // Clear password field
      } else {
        setUpdateSuccess(true)
        setIsEditing(false)
        setEditPassword('') // Clear password field
      }
      
      // Refresh session to get updated data
      const { data: { session: updatedSession } } = await supabase.auth.getSession()
      setSession(updatedSession)

    } catch (error: unknown) {
      setUpdateError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setUpdateLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
        <Text>Loading...</Text>
      </Container>
    )
  }

  // If no session, show nothing (user will be redirected)
  if (!session) {
    return null
  }

  // Protected content for authenticated users
  return (
    <Container size="2" style={{ paddingTop: '50px' }}>
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="6">Dashboard</Heading>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            tabIndex={1}
          >
            Logout
          </Button>
        </Flex>
        
        {emailChangeRequested && !isEditing && (
          <Card style={{ 
            backgroundColor: 'var(--orange-2)', 
            borderColor: 'var(--orange-6)'
          }}>
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <Text color="orange" weight="medium">📧 Email Change Pending</Text>
              </Flex>
              <Text size="2" color="orange">
                Please check your email inbox at <strong>{pendingEmail}</strong> and click the confirmation link to complete your email change.
              </Text>
              <Text size="1" color="gray">
                You may also need to check your current email ({session.user.email}) for additional instructions.
              </Text>
            </Flex>
          </Card>
        )}

        {!session.user.user_metadata?.display_name && !isEditing && (
          <Card style={{ 
            backgroundColor: 'var(--blue-2)', 
            borderColor: 'var(--blue-6)'
          }}>
            <Flex direction="column" gap="3">
              <Flex align="center" gap="2">
                <Text color="blue" weight="medium" size="3">👋 Welcome! Let&apos;s personalize your profile</Text>
              </Flex>
              <Text size="2" color="blue">
                We notice you haven&apos;t set up your display name yet. Adding a display name makes your experience more personal and friendly!
              </Text>
              <Button 
                onClick={handleEditProfile}
                style={{ alignSelf: 'flex-start' }}
                tabIndex={2}
              >
                Set Up Display Name
              </Button>
            </Flex>
          </Card>
        )}

        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">
              {session.user.user_metadata?.display_name 
                ? `Welcome back, ${session.user.user_metadata.display_name}! 🎉`
                : 'Welcome to your dashboard! 🎉'
              }
            </Heading>
            <Text>
              {session.user.user_metadata?.display_name 
                ? `Great to see you again! Your dashboard is ready.`
                : `Hello! You're logged in as ${session.user.email}. Consider setting up your display name below for a more personalized experience.`
              }
            </Text>
            <Text color="gray">
              This page is only accessible to authenticated users.
            </Text>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Flex justify="between" align="center">
              <Heading size="3">User Information</Heading>
              {!isEditing && (
                <Button 
                  size="1" 
                  variant="ghost" 
                  onClick={handleEditProfile}
                  tabIndex={3}
                >
                  <Pencil1Icon width="14" height="14" />
                  Edit
                </Button>
              )}
            </Flex>

            {!isEditing ? (
              <Flex direction="column" gap="2">
                <Text>
                  <strong>Display Name:</strong> {session.user.user_metadata?.display_name || 'Not set'}
                </Text>
                <Text>
                  <strong>Email:</strong> {session.user.email}
                  {pendingEmail && pendingEmail !== session.user.email && (
                    <Text as="span" color="orange" size="1" style={{ marginLeft: '8px' }}>
                      (Change to {pendingEmail} pending verification)
                    </Text>
                  )}
                </Text>
                <Text>
                  <strong>User ID:</strong> {session.user.id}
                </Text>
                <Text>
                  <strong>Last Sign In:</strong> {new Date(session.user.last_sign_in_at || '').toLocaleString()}
                </Text>
              </Flex>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (editDisplayName.trim() && !updateLoading) handleSaveProfile(); }}>
                <Flex direction="column" gap="3">
                  {!session.user.user_metadata?.display_name && (
                    <Flex direction="column" gap="2" style={{ 
                      padding: '12px', 
                      backgroundColor: 'var(--blue-3)', 
                      borderRadius: '6px',
                      border: '1px solid var(--blue-6)'
                    }}>
                      <Text color="blue" size="2" weight="medium">
                        ✨ Let&apos;s set up your display name!
                      </Text>
                      <Text size="1" color="blue">
                        This is how other users will see you and how we&apos;ll greet you when you log in.
                      </Text>
                    </Flex>
                  )}
                  
                  <Flex direction="column" gap="1">
                    <Text size="2" weight="medium">
                      Display Name 
                      {!session.user.user_metadata?.display_name && (
                        <Text as="span" color="blue" size="1"> (Recommended)</Text>
                      )}
                    </Text>
                    <TextField.Root
                      placeholder={
                        !session.user.user_metadata?.display_name 
                          ? "Enter your preferred name (e.g., John Smith)" 
                          : "Enter your display name"
                      }                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="name"
                    autoFocus
                    tabIndex={1}
                    style={
                      !session.user.user_metadata?.display_name 
                        ? { borderColor: 'var(--blue-8)' }
                        : {}
                    }
                  />
                  {!editDisplayName.trim() && (
                    <Text size="1" color="red">
                      ⚠️ Display name is required and cannot be empty
                    </Text>
                  )}
                  {!session.user.user_metadata?.display_name && editDisplayName.trim() && (
                    <Text size="1" color="blue">
                      💡 This will be shown instead of your email address
                    </Text>
                  )}
                </Flex>
                
                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">Email Address</Text>
                  <TextField.Root
                    type="email"
                    placeholder="Enter your email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="email"
                    tabIndex={2}
                  />
                  <Text size="1" color="gray">
                    ⚠️ Changing your email requires verification. You&apos;ll need to click the confirmation link sent to both your old and new email addresses.
                  </Text>
                </Flex>

                <Flex direction="column" gap="1">
                  <Text size="2" weight="medium">
                    Password 
                    <Text as="span" color="gray" size="1"> (Optional)</Text>
                  </Text>
                  <TextField.Root
                    type="password"
                    placeholder="Enter new password (leave empty to keep current)"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="new-password"
                    tabIndex={3}
                  />
                  <Text size="1" color="gray">
                    💡 Only enter a password if you want to change it. Leave empty to keep your current password.
                  </Text>
                </Flex>

                {updateError && (
                  <Text color="red" size="2">
                    {updateError}
                  </Text>
                )}

                {updateSuccess && (
                  <Text color="green" size="2">
                    Profile updated successfully!
                  </Text>
                )}

                {emailChangeRequested && (
                  <Flex direction="column" gap="1" style={{ 
                    padding: '12px', 
                    backgroundColor: 'var(--orange-3)', 
                    borderRadius: '6px',
                    border: '1px solid var(--orange-6)'
                  }}>
                    <Text color="orange" size="2" weight="medium">
                      📧 Email Change Requested
                    </Text>
                    <Text size="1" color="orange">
                      A confirmation email has been sent to <strong>{pendingEmail}</strong>. 
                      Please check both your old and new email inboxes and click the confirmation link to complete the change.
                    </Text>
                    <Text size="1" color="orange">
                      Your email will remain <strong>{session.user.email}</strong> until confirmed.
                    </Text>
                  </Flex>
                )}

                <Flex gap="2">
                  <Button 
                    type="submit"
                    onClick={handleSaveProfile}
                    loading={updateLoading}
                    disabled={updateLoading || !editDisplayName.trim()}
                    tabIndex={4}
                  >
                    {!session.user.user_metadata?.display_name && editDisplayName.trim() 
                      ? 'Complete Profile Setup' 
                      : 'Save Changes'
                    }
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={updateLoading}
                    tabIndex={5}
                  >
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </form>
            )}
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="2">
            <Heading size="3">Quick Actions</Heading>
            <Flex gap="2">
              <Button variant="soft">View Profile</Button>
              <Button variant="soft">Settings</Button>
              <Button variant="soft">Help</Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Container>
  )
}
