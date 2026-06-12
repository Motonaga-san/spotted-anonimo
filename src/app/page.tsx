'use client'

import { useEffect } from 'react'
import SpottedForm from '@/components/SpottedForm'
import SpottedList from '@/components/SpottedList'
import { trackPageView } from '@/lib/supabase'

export default function Home() {
  useEffect(() => {
    // Registra visualização da página
    trackPageView('home')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200 to-orange-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-orange-200 to-yellow-100 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 shadow-xl shadow-pink-500/25 mb-6">
            <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-2">
            Spotted{' '}
            <span className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
              2.0
            </span>
          </h1>
          
          {/* Tagline */}
          <p className="text-lg md:text-xl text-pink-500 font-medium italic mb-4">
            "Because true love never dies"
          </p>
          
          <p className="text-gray-500 max-w-md mx-auto">
            Envie mensagens de forma anônima e segura
          </p>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-medium text-gray-500 shadow-sm">
              100% Anônimo
            </span>
            <span className="px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-medium text-gray-500 shadow-sm">
              Moderação Comunitária
            </span>
            <span className="px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-medium text-gray-500 shadow-sm">
              Livre de Toxicidade
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center gap-12 md:gap-16">
          {/* Formulário */}
          <section className="w-full max-w-xl">
            <div className="bg-white/80 backdrop-blur-lg p-6 md:p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
              <SpottedForm />
            </div>
          </section>

          {/* Divisor */}
          <div className="flex items-center gap-4 w-full max-w-xl">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-gray-400 text-sm">spotteds públicos</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Lista */}
          <section className="w-full flex justify-center">
            <SpottedList />
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center mt-16 md:mt-24 py-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-gray-400">
            <p>Posts são publicados automaticamente.</p>
            <span className="hidden md:inline">•</span>
            <p>Conteúdo ofensivo pode ser denunciado.</p>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <a 
              href="/admin" 
              className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
            >
              Painel Admin
            </a>
            <span className="text-gray-200">•</span>
            <a 
              href="/stats" 
              className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
            >
              Estatísticas
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
