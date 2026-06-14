'use client'

import { useEffect, useState } from 'react'

// Cores da paleta Junina
const COLORS = {
  fire: '#FF7A00',
  gold: '#FFC107',
  burntRed: '#C0392B',
  nightBlue: '#1B263B',
  straw: '#D4A373',
  wood: '#6F4E37',
  pink: '#ec4899',
  green: '#22c55e',
  yellow: '#eab308',
}

export default function JuninaDecoration() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Céu noturno com estrelas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Gradiente noturno sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B263B]/10 via-transparent to-[#1B263B]/5 dark:from-[#1B263B]/20 dark:via-transparent dark:to-[#1B263B]/10" />
        
        {/* Estrelas cintilantes */}
        {[...Array(25)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-0.5 h-0.5 md:w-1 md:h-1 bg-yellow-200 rounded-full animate-sparkle"
            style={{
              top: `${5 + (i * 3.5)}%`,
              left: `${2 + (i * 4)}%`,
              animationDelay: `${i * 0.2}s`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      {/* Bandeirinhas no topo - mais elaboradas */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none overflow-hidden">
        <svg className="w-full h-10 md:h-14" viewBox="0 0 1400 60" preserveAspectRatio="none">
          {/* Corda das bandeirinhas */}
          <path
            d="M0,25 Q350,15 700,25 T1400,25"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-yellow-500/40 dark:text-yellow-400/30"
          />
          
          {/* Bandeirinhas coloridas com animação */}
          {[...Array(28)].map((_, i) => {
            const x = 25 + i * 50
            const colors = [COLORS.fire, COLORS.gold, COLORS.burntRed, COLORS.green, COLORS.pink, COLORS.yellow]
            const color = colors[i % colors.length]
            const delay = i * 0.15
            
            return (
              <g 
                key={i} 
                style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px 25px` }} 
                className="animate-bandeirola"
              >
                {/* Triângulo da bandeirinha */}
                <polygon
                  points={`${x},25 ${x+15},25 ${x+7.5},55`}
                  fill={color}
                  opacity="0.85"
                />
                {/* Linha de contorno */}
                <polygon
                  points={`${x},25 ${x+15},25 ${x+7.5},55`}
                  fill="none"
                  stroke="rgba(0,0,0,0.2)"
                  strokeWidth="0.5"
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Fogueira elaborada - canto inferior direito */}
      <div className="fixed bottom-4 right-4 md:bottom-12 md:right-12 z-30 pointer-events-none">
        <svg className="w-24 h-32 md:w-36 md:h-44" viewBox="0 0 120 150">
          {/* Base de madeira/tora */}
          <g className="animate-pulse-soft">
            {/* Tora inferior */}
            <rect x="25" y="110" width="70" height="12" fill={COLORS.wood} rx="4" />
            <rect x="25" y="110" width="70" height="3" fill="rgba(139,90,43,0.5)" rx="2" />
            
            {/* Tora média */}
            <rect x="30" y="100" width="60" height="12" fill="#8B5A2B" rx="4" />
            <rect x="30" y="100" width="60" height="3" fill="rgba(139,90,43,0.5)" rx="2" />
            
            {/* Tora superior */}
            <rect x="35" y="90" width="50" height="12" fill={COLORS.wood} rx="4" />
            
            {/* Detalhes de madeira */}
            <line x1="35" y1="94" x2="85" y2="94" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
            <line x1="35" y1="98" x2="85" y2="98" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          </g>
          
          {/* Chamas principais */}
          <g className="animate-flame" style={{ transformOrigin: '60px 90px' }}>
            {/* Chama grande central */}
            <path
              d="M60,20 C75,35 80,50 75,70 C70,80 65,85 60,85 C55,85 50,80 45,70 C40,50 45,35 60,20 Z"
              fill={`url(#flame-main)`}
            />
            
            {/* Chama esquerda */}
            <path
              d="M45,35 C55,45 50,55 50,70 C48,78 45,82 42,80 C38,75 35,60 45,35 Z"
              fill={`url(#flame-left)`}
              style={{ animationDelay: '0.3s' }}
            />
            
            {/* Chama direita */}
            <path
              d="M75,35 C85,45 80,55 78,70 C75,78 72,82 70,80 C65,75 65,60 75,35 Z"
              fill={`url(#flame-right)`}
              style={{ animationDelay: '0.5s' }}
            />
            
            {/* Chama interna (mais clara/quentão) */}
            <ellipse cx="60" cy="60" rx="8" ry="20" fill={`url(#flame-inner)`} />
          </g>
          
          {/* Brasas subindo */}
          {[...Array(8)].map((_, i) => (
            <circle
              key={`ember-${i}`}
              cx={55 + i * 2}
              cy={20 + i * 3}
              r={1 + (i % 3)}
              fill={COLORS.fire}
              className="animate-ember"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
          
          {/* Faíscas */}
          {[...Array(6)].map((_, i) => (
            <circle
              key={`spark-${i}`}
              cx={50 + i * 4}
              cy={15 + (i % 3) * 5}
              r="1"
              fill={COLORS.gold}
              className="animate-sparkle"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
          
          {/* Gradientes para as chamas */}
          <defs>
            <linearGradient id="flame-main" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={COLORS.burntRed} />
              <stop offset="40%" stopColor={COLORS.fire} />
              <stop offset="70%" stopColor={COLORS.gold} />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <linearGradient id="flame-left" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#C0392B" />
              <stop offset="60%" stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#FFC107" />
            </linearGradient>
            <linearGradient id="flame-right" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#C0392B" />
              <stop offset="50%" stopColor="#FF7A00" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <radialGradient id="flame-inner" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#FFC107" />
              <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.5" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Correio Elegante - canto inferior esquerdo */}
      <div className="fixed bottom-4 left-4 md:bottom-12 md:left-12 z-30 pointer-events-none animate-float-gentle">
        <svg className="w-20 h-20 md:w-28 md:h-28" viewBox="0 0 100 100">
          {/* Envelope principal */}
          <g className="animate-pulse-soft">
            {/* Corpo do envelope */}
            <rect x="15" y="30" width="70" height="50" fill={COLORS.burntRed} rx="3" />
            <rect x="18" y="33" width="64" height="44" fill={COLORS.fire} rx="2" />
            
            {/* Aba do envelope */}
            <path d="M15,35 L50,55 L85,35 L85,33 L15,33 Z" fill={COLORS.burntRed} />
            <path d="M18,36 L50,53 L82,36 L82,35 L18,35 Z" fill="#d44a33" />
            
            {/* Linha de dobra */}
            <path d="M15,35 L50,55 L85,35" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
            
            {/* Coração central */}
            <path
              d="M50,62 C50,62 42,54 42,48 C42,43 45,40 50,44 C55,40 58,43 58,48 C58,54 50,62 50,62 Z"
              fill={COLORS.gold}
              className="animate-pulse-soft"
            />
            {/* Brilho no coração */}
            <ellipse cx="47" cy="46" rx="2" ry="1.5" fill="rgba(255,255,255,0.4)" />
          </g>
          
          {/* Selos decorativos */}
          <circle cx="75" cy="40" r="8" fill={COLORS.straw} />
          <circle cx="75" cy="40" r="6" fill={COLORS.gold} />
          <text x="75" y="43" textAnchor="middle" fontSize="6" fill={COLORS.burntRed}>S.J</text>
          
          {/* Sternilhas decorativas */}
          <circle cx="20" cy="25" r="2" fill={COLORS.gold} className="animate-sparkle" style={{ animationDelay: '0.2s' }} />
          <circle cx="80" cy="20" r="2.5" fill={COLORS.fire} className="animate-sparkle" style={{ animationDelay: '0.7s' }} />
          <circle cx="15" cy="85" r="2" fill={COLORS.gold} className="animate-sparkle" style={{ animationDelay: '1.2s' }} />
          
          {/* Peninha */}
          <path
            d="M88,25 Q95,15 90,30 Q92,35 88,40 Q85,35 88,25 Z"
            fill={COLORS.straw}
            opacity="0.8"
          />
          <line x1="88" y1="25" x2="88" y2="40" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Elementos decorativos flutuantes (milho e chapéu) */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-30 dark:opacity-20">
        <svg className="w-32 h-8" viewBox="0 0 120 30">
          {/* Espiga de milho */}
          <ellipse cx="20" cy="15" rx="8" ry="12" fill={COLORS.gold} />
          <path d="M12,15 Q15,10 12,8 Q20,5 28,8 Q25,10 28,15" fill={COLORS.straw} />
          
          {/* Chapéu de palha */}
          <ellipse cx="60" cy="18" rx="15" ry="8" fill={COLORS.straw} />
          <rect x="50" y="10" width="20" height="10" fill={COLORS.straw} rx="2" />
          <rect x="45" y="18" width="30" height="4" fill="#c4a77d" rx="2" />
          <circle cx="60" cy="14" r="3" fill={COLORS.burntRed} />
          
          {/* Sanfona simplificada */}
          <rect x="90" y="8" width="20" height="16" fill={COLORS.burntRed} rx="2" />
          <rect x="95" y="12" width="3" height="10" fill="white" rx="1" />
          <rect x="102" y="12" width="3" height="10" fill="white" rx="1" />
          <circle cx="95" cy="8" r="2" fill="white" />
          <circle cx="105" cy="8" r="2" fill="white" />
        </svg>
      </div>
    </>
  )
}
