'use client'

import { useState, useEffect } from 'react'
import { Theme } from '@radix-ui/themes'
import ThemeToggle from './ThemeToggle'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setAppearance(shouldBeDark ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const newAppearance = appearance === 'dark' ? 'light' : 'dark'
    setAppearance(newAppearance)
    localStorage.setItem('theme', newAppearance)
  }

  return (
    <Theme accentColor="jade" grayColor="mauve" appearance={appearance}>
      <ThemeToggle onToggle={toggleTheme} isDark={appearance === 'dark'} />
      {children}
    </Theme>
  )
}
