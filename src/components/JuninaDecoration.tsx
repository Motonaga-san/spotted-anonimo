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
  blue: '#3b82f6',
  purple: '#a855f7',
}

export default function JuninaDecoration() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Céu noturno com constelação do Cruzeiro do Sul */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Gradiente noturno sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B263B]/10 via-transparent to-[#1B263B]/5 dark:from-[#1B263B]/20 dark:via-transparent dark:to-[#1B263B]/10" />
        
        {/* Constelação do Cruzeiro do Sul */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {/* Cruzeiro do Sul - posição no céu brasileiro */}
          <g transform="translate(25, 15)">
            {/* Gacrux (Gamma Crucis) - topo do cruzeiro */}
            <circle cx="0" cy="0" r="1.2" fill="#fef08a" className="animate-sparkle" style={{ animationDelay: '0s' }}>
              <animate attributeName="opacity" values="0.6;1;0.8;1;0.6" dur="3s" repeatCount="indefinite" />
            </circle>
            
            {/* Delta Crucis - ponta esquerda */}
            <circle cx="-5" cy="5" r="1" fill="#fef08a" className="animate-sparkle" style={{ animationDelay: '0.3s' }}>
              <animate attributeName="opacity" values="0.7;1;0.6;1;0.7" dur="2.5s" repeatCount="indefinite" />
            </circle>
            
            {/* Estrela central (ponto de intersecção) - Epsilon Crucis */}
            <circle cx="0" cy="5" r="0.6" fill="#fef08a">
              <animate attributeName="opacity" values="0.5;0.8;0.6;0.9;0.5" dur="4s" repeatCount="indefinite" />
            </circle>
            
            {/* Mimosa (Beta Crucis) - ponta direita */}
            <circle cx="5" cy="5" r="1.1" fill="#fef08a" className="animate-sparkle" style={{ animationDelay: '0.5s' }}>
              <animate attributeName="opacity" values="0.8;1;0.7;1;0.8" dur="2.8s" repeatCount="indefinite" />
            </circle>
            
            {/* Acrux (Alpha Crucis) - pé do cruzeiro (mais brilhante) */}
            <circle cx="0" cy="10" r="1.5" fill="#fff" className="animate-sparkle" style={{ animationDelay: '0.2s' }}>
              <animate attributeName="opacity" values="0.9;1;0.85;1;0.9" dur="3.5s" repeatCount="indefinite" />
            </circle>
            
            {/* Linhas conectando as estrelas (sutil) */}
            <g stroke="rgba(254, 240, 138, 0.15)" strokeWidth="0.3">
              {/* Vertical */}
              <line x1="0" y1="0" x2="0" y2="10" />
              {/* Horizontal */}
              <line x1="-5" y1="5" x2="5" y2="5" />
            </g>
          </g>
          
          {/* Estrelas ao redor do Cruzeiro - como no céu real */}
          {[
            // Estrelas próximas ao Cruzeiro
            { x: 30, y: 8, r: 0.4, d: '0.1s' },
            { x: 22, y: 12, r: 0.3, d: '0.4s' },
            { x: 28, y: 20, r: 0.5, d: '0.6s' },
            { x: 18, y: 18, r: 0.3, d: '0.8s' },
            { x: 35, y: 22, r: 0.4, d: '1s' },
            
            // Estrelas dispersas pelo céu
            { x: 5, y: 5, r: 0.5, d: '0.2s' },
            { x: 10, y: 12, r: 0.3, d: '0.5s' },
            { x: 3, y: 20, r: 0.4, d: '0.7s' },
            { x: 8, y: 28, r: 0.3, d: '0.9s' },
            { x: 15, y: 5, r: 0.4, d: '1.1s' },
            { x: 12, y: 35, r: 0.5, d: '1.3s' },
            { x: 20, y: 40, r: 0.3, d: '1.5s' },
            { x: 35, y: 8, r: 0.4, d: '0.3s' },
            { x: 45, y: 15, r: 0.5, d: '0.6s' },
            { x: 50, y: 5, r: 0.3, d: '0.9s' },
            { x: 55, y: 20, r: 0.4, d: '1.2s' },
            { x: 60, y: 8, r: 0.3, d: '1.5s' },
            { x: 65, y: 25, r: 0.5, d: '0.4s' },
            { x: 70, y: 10, r: 0.4, d: '0.8s' },
            { x: 75, y: 18, r: 0.3, d: '1.1s' },
            { x: 80, y: 8, r: 0.5, d: '1.4s' },
            { x: 85, y: 22, r: 0.4, d: '0.2s' },
            { x: 90, y: 12, r: 0.3, d: '0.6s' },
            { x: 95, y: 25, r: 0.4, d: '1s' },
            
            // Mais estrelas no céu
            { x: 40, y: 35, r: 0.3, d: '0.5s' },
            { x: 55, y: 40, r: 0.4, d: '0.9s' },
            { x: 70, y: 35, r: 0.3, d: '1.3s' },
            { x: 85, y: 40, r: 0.5, d: '0.7s' },
            { x: 25, y: 55, r: 0.4, d: '1.1s' },
            { x: 40, y: 60, r: 0.3, d: '0.3s' },
            { x: 60, y: 55, r: 0.4, d: '0.8s' },
            { x: 75, y: 60, r: 0.3, d: '1.2s' },
            { x: 90, y: 55, r: 0.4, d: '0.6s' },
            { x: 10, y: 50, r: 0.3, d: '1s' },
            { x: 95, y: 70, r: 0.4, d: '0.4s' },
            { x: 80, y: 75, r: 0.3, d: '0.9s' },
            { x: 65, y: 80, r: 0.5, d: '1.3s' },
            { x: 50, y: 75, r: 0.3, d: '0.7s' },
            { x: 35, y: 80, r: 0.4, d: '1.1s' },
            { x: 20, y: 75, r: 0.3, d: '0.5s' },
            { x: 5, y: 80, r: 0.4, d: '1.5s' },
          ].map((star, i) => (
            <circle
              key={`star-${i}`}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill="#fef08a"
            >
              <animate 
                attributeName="opacity" 
                values={`${0.3 + Math.random() * 0.3};${0.5 + Math.random() * 0.4};${0.2 + Math.random() * 0.3};${0.6 + Math.random() * 0.3};${0.3 + Math.random() * 0.3}`}
                dur={`${2 + Math.random() * 3}s`}
                repeatCount="indefinite"
                begin={star.d}
              />
            </circle>
          ))}
        </svg>
      </div>

      {/* Bandeirinhas de Festa Junina - formato pentágono/pennant */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none overflow-hidden">
        <svg className="w-full h-20 md:h-24" viewBox="0 0 1400 90" preserveAspectRatio="none">
          {/* Corda das bandeirinhas */}
          <path
            d="M0,20 Q350,12 700,20 T1400,20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-yellow-500/50 dark:text-yellow-400/40"
          />
          
          {/* Bandeirinhas maiores (juntando 2 em 1) - V com 1/3 da altura */}
          {[...Array(14)].map((_, i) => {
            const x = 20 + i * 100  // espaçamento menor = mais próximas
            const colors = [
              COLORS.fire,      // laranja
              COLORS.gold,      // amarelo
              COLORS.burntRed,  // vermelho
              COLORS.green,     // verde
              COLORS.pink,      // rosa
              COLORS.blue,      // azul
              COLORS.purple,    // roxo
            ]
            const color = colors[i % colors.length]
            const delay = i * 0.12
            
            // Dimensões da bandeirinha (mais larga e próxima)
            const width = 70
            const height = 45
            
            // Profundidade do V (1/3 da altura)
            const notchDepth = height / 3
            
            return (
              <g 
                key={i} 
                style={{ animationDelay: `${delay}s`, transformOrigin: `${x + width/2}px 20px` }} 
                className="animate-bandeirola"
              >
                {/* 
                  Bandeirinha Festa Junina: retângulo com V entrando (1/3 da altura)
                  
                       _________   ← topo (corda)
                      |         |
                      |         |
                      |    /\   |   ← V entrando (1/3 da altura)
                      |  /    \ |
                      | /      \|   ← base inferior
                      |/        \|
                  
                  Vértices:
                  1. (x, 20) - topo esquerdo
                  2. (x+width, 20) - topo direito
                  3. (x+width, 20+height) - canto inferior direito
                  4. (x+width/2, 20+height-notchDepth) - vértice do V (entrando)
                  5. (x, 20+height) - canto inferior esquerdo
                */}
                <polygon
                  points={`
                    ${x},20 
                    ${x+width},20 
                    ${x+width},${20+height}
                    ${x+width/2},${20+height-notchDepth}
                    ${x},${20+height}
                  `}
                  fill={color}
                  opacity="0.9"
                />
                {/* Contorno sutil */}
                <polygon
                  points={`
                    ${x},20 
                    ${x+width},20 
                    ${x+width},${20+height}
                    ${x+width/2},${20+height-notchDepth}
                    ${x},${20+height}
                  `}
                  fill="none"
                  stroke="rgba(0,0,0,0.15)"
                  strokeWidth="0.8"
                />
                {/* Linha decorativa central */}
                <line
                  x1={x + width/2}
                  y1="24"
                  x2={x + width/2}
                  y2={20 + height - notchDepth - 3}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5"
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
    </>
  )
}
