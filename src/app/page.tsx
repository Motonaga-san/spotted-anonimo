'use client'
 
import { useEffect } from 'react'
import Link from 'next/link'
import SpottedForm from '@/components/SpottedForm'
import SpottedList from '@/components/SpottedList'
import { trackPageView } from '@/lib/supabase'

export default function Home() {
  useEffect(() => {
    trackPageView('home')
  }, [])

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-500/10 to-orange-500/5 dark:from-pink-500/20 dark:to-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/5 dark:from-purple-500/15 dark:to-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 dark:from-orange-500/10 dark:to-yellow-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16">
          {/* Banner Festas Juninas */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-pink-500/20 rounded-full border border-yellow-500/30 animate-pulse-soft">
            <span className="text-lg">🌽</span>
            <span className="text-sm font-medium text-yellow-400 dark:text-yellow-300">
              Feliz São João! 🎉
            </span>
            <span className="text-lg">🔥</span>
          </div>

          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 shadow-xl shadow-pink-500/25 mb-6">
            <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-2">
            Spotted{' '}
            <span className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
              2.0
            </span>
          </h1>
          
          {/* Tagline */}
          <p className="text-lg md:text-xl text-pink-400 font-medium italic mb-4">
            "Because true love never dies"
          </p>
          
          <p className="max-w-md mx-auto text-secondary">
            Envie mensagens de forma anônima e segura
          </p>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="px-3 py-1.5 card-theme rounded-full text-xs font-medium text-secondary">
              100% Anônimo
            </span>
            <span className="px-3 py-1.5 card-theme rounded-full text-xs font-medium text-secondary">
              Moderação Comunitária
            </span>
            <span className="px-3 py-1.5 card-theme rounded-full text-xs font-medium text-secondary">
              Livre de Toxicidade
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center gap-12 md:gap-16">
          {/* Formulário */}
          <section className="w-full max-w-xl">
            <div className="card-theme p-6 md:p-8 rounded-3xl shadow-xl">
              <SpottedForm />
            </div>
          </section>

          {/* Divisor */}
          <div className="flex items-center gap-4 w-full max-w-xl">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-sm text-muted">spotteds públicos</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Lista */}
          <section className="w-full flex justify-center">
            <SpottedList />
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 md:mt-24 py-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted">
            <p>Posts são publicados automaticamente.</p>
            <span className="hidden md:inline">•</span>
            <p>Conteúdo ofensivo pode ser denunciado.</p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link 
              href="/admin" 
              className="text-xs text-muted hover:text-secondary transition-colors"
            >
              Painel Admin
            </Link>
            <span className="text-border">•</span>
            <Link 
              href="/stats" 
              className="text-xs text-muted hover:text-secondary transition-colors"
            >
              Estatísticas
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
