'use client'

import { useTheme } from '@/context/ThemeContext'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="fixed top-4 right-4 z-[9999] p-3 rounded-full bg-pink-500" style={{ minWidth: '48px', minHeight: '48px' }} />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-[9999] p-3 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg hover:scale-110 transition-transform duration-200"
      title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      style={{ minWidth: '48px', minHeight: '48px' }}
      aria-label="Alternar tema"
    >
      {theme === 'dark' ? (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}
