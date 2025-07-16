'use client'

import { Button } from '@radix-ui/themes'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'

interface ThemeToggleProps {
  onToggle: () => void
  isDark: boolean
}

export default function ThemeToggle({ onToggle, isDark }: ThemeToggleProps) {
  return (
    <Button
      variant="ghost"
      size="2"
      onClick={onToggle}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        padding: '0'
      }}
    >
      {isDark ? <SunIcon width="18" height="18" /> : <MoonIcon width="18" height="18" />}
    </Button>
  )
}
