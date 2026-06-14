'use client'

import { useEffect, useState } from 'react'

export default function JuninaDecoration() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Bandeirolas no topo */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none overflow-hidden">
        <svg className="w-full h-8 md:h-12" viewBox="0 0 1200 50" preserveAspectRatio="none">
          {/* Corda das bandeirolas */}
          <path
            d="M0,20 Q300,10 600,20 T1200,20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-pink-500/40 dark:text-pink-500/30"
          />
          
          {/* Bandeirolas coloridas */}
          {[...Array(20)].map((_, i) => {
            const x = 30 + i * 60
            const colors = [
              '#ec4899', // pink
              '#f97316', // orange
              '#eab308', // yellow
              '#22c55e', // green
              '#ef4444', // red
            ]
            const color = colors[i % colors.length]
            const delay = i * 0.1
            
            return (
              <g key={i} style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px 20px` }} className="animate-sway">
                <polygon
                  points={`${x},20 ${x+12},20 ${x+6},45`}
                  fill={color}
                  opacity="0.7"
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Fogueira decorativa - canto inferior direito */}
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-30 pointer-events-none opacity-60 dark:opacity-40">
        <svg className="w-16 h-20 md:w-24 md:h-28" viewBox="0 0 80 100">
          {/* Base da fogueira */}
          <g className="animate-pulse-soft">
            <rect x="25" y="70" width="30" height="8" fill="#8B4513" rx="2" />
            <rect x="20" y="78" width="40" height="6" fill="#A0522D" rx="2" />
            <rect x="30" y="65" width="20" height="8" fill="#6B3E26" rx="1" />
          </g>
          
          {/* Chamas */}
          <g className="animate-flame" style={{ transformOrigin: '40px 70px' }}>
            {/* Chama central (maior) */}
            <ellipse cx="40" cy="45" rx="12" ry="25" fill="url(#flame-gradient-1)" />
            {/* Chama esquerda */}
            <ellipse cx="32" cy="50" rx="8" ry="18" fill="url(#flame-gradient-2)" />
            {/* Chama direita */}
            <ellipse cx="48" cy="50" rx="8" ry="18" fill="url(#flame-gradient-2)" />
            {/* Chama interna (mais clara) */}
            <ellipse cx="40" cy="50" rx="6" ry="15" fill="url(#flame-gradient-3)" />
          </g>
          
          {/* Sparkles/faíscas */}
          <circle cx="35" cy="25" r="2" fill="#fef08a" className="animate-sparkle" style={{ animationDelay: '0s' }} />
          <circle cx="45" cy="30" r="1.5" fill="#fef08a" className="animate-sparkle" style={{ animationDelay: '0.5s' }} />
          <circle cx="40" cy="20" r="1" fill="#fef08a" className="animate-sparkle" style={{ animationDelay: '1s' }} />
          <circle cx="50" cy="35" r="1.5" fill="#fef08a" className="animate-sparkle" style={{ animationDelay: '1.5s' }} />
          
          {/* Gradientes */}
          <defs>
            <linearGradient id="flame-gradient-1" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <linearGradient id="flame-gradient-2" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="flame-gradient-3" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#fff" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Correio Elegante - canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-30 pointer-events-none opacity-60 dark:opacity-40 animate-float-gentle">
        <svg className="w-14 h-14 md:w-20 md:h-20" viewBox="0 0 80 80">
          {/* Envelope */}
          <g className="animate-pulse-soft" style={{ animationDelay: '1s' }}>
            <rect x="10" y="20" width="60" height="45" fill="#ec4899" rx="3" />
            <rect x="12" y="22" width="56" height="41" fill="#db2777" rx="2" />
            
            {/* Tampo do envelope */}
            <path d="M10,25 L40,45 L70,25" fill="none" stroke="#be185d" strokeWidth="2" />
            <path d="M12,23 L40,43 L68,23" fill="#f472b6" />
            
            {/* Coração no envelope */}
            <path 
              d="M40,50 C40,50 32,42 32,37 C32,33 35,30 40,34 C45,30 48,33 48,37 C48,42 40,50 40,50 Z" 
              fill="#fef08a"
              className="animate-pulse-soft"
            />
          </g>
          
          {/* Sternilha decorativa */}
          <circle cx="60" cy="15" r="3" fill="#f97316" className="animate-sparkle" style={{ animationDelay: '0.3s' }} />
          <circle cx="65" cy="12" r="2" fill="#eab308" className="animate-sparkle" style={{ animationDelay: '0.8s' }} />
          <circle cx="55" cy="10" r="2" fill="#ec4899" className="animate-sparkle" style={{ animationDelay: '1.2s' }} />
        </svg>
      </div>

      {/* Estrelas cintilantes no fundo (estilo noite de São João) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"
            style={{
              top: `${10 + (i * 5)}%`,
              left: `${5 + (i * 6)}%`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    </>
  )
}
