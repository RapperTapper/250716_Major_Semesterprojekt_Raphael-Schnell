'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Container, Text } from '@radix-ui/themes'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function AuthGuard({ children, redirectTo = '/' }: AuthGuardProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      
      if (!session) {
        router.push(redirectTo)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      
      if (!session) {
        router.push(redirectTo)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, redirectTo])

  if (loading) {
    return (
      <Container size="1" style={{ paddingTop: '100px' }}>
        <Text>Loading...</Text>
      </Container>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}
