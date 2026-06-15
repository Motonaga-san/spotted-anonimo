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
        
        {/* Constelação do Cruzeiro do Sul - centralizado e mais baixo */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {/* Definições para estrelas de 4 pontas com halo violeta */}
          <defs>
            {/* Filtro para halo violeta suave */}
            <filter id="star-halo" x="-300%" y="-300%" width="700%" height="700%">
              <feGaussianBlur stdDeviation="0.35" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Filtro para estrelas mais brilhantes */}
            <filter id="star-halo-bright" x="-400%" y="-400%" width="900%" height="900%">
              <feGaussianBlur stdDeviation="0.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Gradiente violeta para halo */}
            <radialGradient id="halo-violet">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="30%" stopColor="#e9d5ff"/>
              <stop offset="60%" stopColor="#c4b5fd"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0"/>
            </radialGradient>
            {/* Gradiente para estrelas menores */}
            <radialGradient id="star-small">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="50%" stopColor="#ddd6fe"/>
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/>
            </radialGradient>
            
            {/* Componente de estrela de 4 pontas com raios afinando */}
            <g id="star-4-points">
              {/* Halo violeta */}
              <circle cx="0" cy="0" r="0.7" fill="url(#halo-violet)"/>
              {/* Núcleo branco */}
              <circle cx="0" cy="0" r="0.1" fill="#ffffff"/>
              {/* 4 raios afinando da base para a ponta (losangos) */}
              {/* Raio superior - sai dos lados e afina até a ponta */}
              <polygon points="0,-0.55 -0.06,-0.08 0.06,-0.08" fill="#ffffff"/>
              {/* Raio inferior */}
              <polygon points="0,0.55 -0.06,0.08 0.06,0.08" fill="#ffffff"/>
              {/* Raio esquerdo */}
              <polygon points="-0.55,0 -0.08,-0.06 -0.08,0.06" fill="#ffffff"/>
              {/* Raio direito */}
              <polygon points="0.55,0 0.08,-0.06 0.08,0.06" fill="#ffffff"/>
            </g>
            
            {/* Estrela menor */}
            <g id="star-small-template">
              <circle cx="0" cy="0" r="0.35" fill="url(#star-small)"/>
              <circle cx="0" cy="0" r="0.05" fill="#ffffff"/>
              <polygon points="0,-0.25 -0.04,-0.04 0.04,-0.04" fill="#ffffff"/>
              <polygon points="0,0.25 -0.04,0.04 0.04,0.04" fill="#ffffff"/>
              <polygon points="-0.25,0 -0.04,-0.04 -0.04,0.04" fill="#ffffff"/>
              <polygon points="0.25,0 0.04,-0.04 0.04,0.04" fill="#ffffff"/>
            </g>
            
            {/* Estrela ainda menor */}
            <g id="star-tiny-template">
              <circle cx="0" cy="0" r="0.2" fill="url(#star-small)"/>
              <circle cx="0" cy="0" r="0.03" fill="#ffffff"/>
              <polygon points="0,-0.15 -0.025,-0.025 0.025,-0.025" fill="#ffffff"/>
              <polygon points="0,0.15 -0.025,0.025 0.025,0.025" fill="#ffffff"/>
              <polygon points="-0.15,0 -0.025,-0.025 -0.025,0.025" fill="#ffffff"/>
              <polygon points="0.15,0 0.025,-0.025 0.025,0.025" fill="#ffffff"/>
            </g>
          </defs>
          
          {/* Cruzeiro do Sul - centralizado e mais baixo no céu */}
          <g transform="translate(50, 32)">
            {/* Gacrux (Gamma Crucis) - topo do cruzeiro */}
            <g filter="url(#star-halo)">
              <circle cx="0" cy="0" r="0.85" fill="url(#halo-violet)"/>
              <circle cx="0" cy="0" r="0.12" fill="#ffffff"/>
              {/* Raios afinando */}
              <polygon points="0,-0.6 -0.07,-0.1 0.07,-0.1" fill="#ffffff"/>
              <polygon points="0,0.6 -0.07,0.1 0.07,0.1" fill="#ffffff"/>
              <polygon points="-0.6,0 -0.1,-0.07 -0.1,0.07" fill="#ffffff"/>
              <polygon points="0.6,0 0.1,-0.07 0.1,0.07" fill="#ffffff"/>
              <animate attributeName="opacity" values="0.7;1;0.85;0.95;0.7" dur="4s" repeatCount="indefinite" />
            </g>
            
            {/* Delta Crucis - ponta esquerda */}
            <g transform="translate(-2, 2)" filter="url(#star-halo)">
              <circle cx="0" cy="0" r="0.72" fill="url(#halo-violet)"/>
              <circle cx="0" cy="0" r="0.1" fill="#ffffff"/>
              <polygon points="0,-0.5 -0.06,-0.08 0.06,-0.08" fill="#ffffff"/>
              <polygon points="0,0.5 -0.06,0.08 0.06,0.08" fill="#ffffff"/>
              <polygon points="-0.5,0 -0.08,-0.06 -0.08,0.06" fill="#ffffff"/>
              <polygon points="0.5,0 0.08,-0.06 0.08,0.06" fill="#ffffff"/>
              <animate attributeName="opacity" values="0.75;0.95;0.8;1;0.75" dur="3.5s" repeatCount="indefinite" />
            </g>
            
            {/* Epsilon Crucis - estrela central (menor) */}
            <use href="#star-small-template" transform="translate(0, 2)" filter="url(#star-halo)">
              <animate attributeName="opacity" values="0.6;0.85;0.7;0.9;0.6" dur="5s" repeatCount="indefinite" />
            </use>
            
            {/* Mimosa (Beta Crucis) - ponta direita */}
            <g transform="translate(2, 2)" filter="url(#star-halo)">
              <circle cx="0" cy="0" r="0.75" fill="url(#halo-violet)"/>
              <circle cx="0" cy="0" r="0.1" fill="#ffffff"/>
              <polygon points="0,-0.52 -0.06,-0.08 0.06,-0.08" fill="#ffffff"/>
              <polygon points="0,0.52 -0.06,0.08 0.06,0.08" fill="#ffffff"/>
              <polygon points="-0.52,0 -0.08,-0.06 -0.08,0.06" fill="#ffffff"/>
              <polygon points="0.52,0 0.08,-0.06 0.08,0.06" fill="#ffffff"/>
              <animate attributeName="opacity" values="0.8;1;0.75;0.95;0.8" dur="3.8s" repeatCount="indefinite" />
            </g>
            
            {/* Acrux (Alpha Crucis) - pé do cruzeiro (mais brilhante) */}
            <g transform="translate(0, 4)" filter="url(#star-halo-bright)">
              <circle cx="0" cy="0" r="1" fill="url(#halo-violet)"/>
              <circle cx="0" cy="0" r="0.15" fill="#ffffff"/>
              <polygon points="0,-0.7 -0.08,-0.12 0.08,-0.12" fill="#ffffff"/>
              <polygon points="0,0.7 -0.08,0.12 0.08,0.12" fill="#ffffff"/>
              <polygon points="-0.7,0 -0.12,-0.08 -0.12,0.08" fill="#ffffff"/>
              <polygon points="0.7,0 0.12,-0.08 0.12,0.08" fill="#ffffff"/>
              <animate attributeName="opacity" values="0.85;1;0.9;1;0.85" dur="4.5s" repeatCount="indefinite" />
            </g>
          </g>
          
          {/* Estrelas ao redor com 4 pontas */}
          {[
            // Próximas ao Cruzeiro - um pouco maiores
            { x: 54, y: 30, size: 'small', dur: 3.2 },
            { x: 46, y: 34, size: 'tiny', dur: 4.1 },
            { x: 52, y: 38, size: 'small', dur: 3.7 },
            { x: 48, y: 40, size: 'tiny', dur: 4.5 },
            { x: 56, y: 35, size: 'tiny', dur: 3.9 },
            
            // Dispersas pelo céu
            { x: 5, y: 5, size: 'small', dur: 4.2 },
            { x: 12, y: 8, size: 'tiny', dur: 3.5 },
            { x: 3, y: 15, size: 'tiny', dur: 4.8 },
            { x: 8, y: 22, size: 'tiny', dur: 3.3 },
            { x: 15, y: 4, size: 'tiny', dur: 4.6 },
            { x: 20, y: 12, size: 'small', dur: 3.8 },
            { x: 6, y: 30, size: 'tiny', dur: 4.4 },
            { x: 18, y: 28, size: 'tiny', dur: 3.6 },
            { x: 10, y: 40, size: 'tiny', dur: 4.9 },
            { x: 25, y: 35, size: 'small', dur: 3.4 },
            
            { x: 75, y: 5, size: 'tiny', dur: 3.6 },
            { x: 82, y: 10, size: 'small', dur: 4.3 },
            { x: 88, y: 8, size: 'tiny', dur: 3.4 },
            { x: 92, y: 15, size: 'tiny', dur: 4.7 },
            { x: 78, y: 22, size: 'tiny', dur: 3.9 },
            { x: 85, y: 28, size: 'small', dur: 4.1 },
            { x: 95, y: 25, size: 'tiny', dur: 3.7 },
            { x: 72, y: 35, size: 'tiny', dur: 4.5 },
            { x: 88, y: 40, size: 'tiny', dur: 3.3 },
            { x: 95, y: 50, size: 'small', dur: 4.2 },
            { x: 80, y: 55, size: 'tiny', dur: 3.8 },
            { x: 92, y: 60, size: 'tiny', dur: 4.6 },
            
            { x: 65, y: 50, size: 'tiny', dur: 4.5 },
            { x: 35, y: 55, size: 'small', dur: 3.5 },
            { x: 42, y: 48, size: 'tiny', dur: 4.4 },
            { x: 58, y: 55, size: 'small', dur: 3.6 },
            { x: 28, y: 48, size: 'tiny', dur: 4.8 },
            { x: 72, y: 48, size: 'tiny', dur: 3.4 },
            { x: 50, y: 60, size: 'tiny', dur: 4.0 },
            { x: 38, y: 65, size: 'small', dur: 3.7 },
            { x: 62, y: 65, size: 'tiny', dur: 4.3 },
            { x: 30, y: 70, size: 'tiny', dur: 3.9 },
            { x: 70, y: 70, size: 'tiny', dur: 4.5 },
            { x: 45, y: 75, size: 'small', dur: 3.6 },
            { x: 55, y: 75, size: 'tiny', dur: 4.2 },
            { x: 22, y: 60, size: 'tiny', dur: 3.8 },
            { x: 78, y: 60, size: 'tiny', dur: 4.4 },
            { x: 15, y: 75, size: 'small', dur: 3.5 },
            { x: 85, y: 75, size: 'tiny', dur: 4.1 },
            { x: 8, y: 85, size: 'tiny', dur: 3.7 },
            { x: 92, y: 85, size: 'tiny', dur: 4.6 },
          ].map((star, i) => (
            <use 
              key={`star-${i}`} 
              href={star.size === 'small' ? '#star-small-template' : '#star-tiny-template'} 
              x={star.x} 
              y={star.y} 
              filter="url(#star-halo)"
            >
              <animate 
                attributeName="opacity" 
                values={`${0.35 + (i % 3) * 0.08};${0.5 + (i % 4) * 0.06};${0.38 + (i % 2) * 0.08};${0.45 + (i % 3) * 0.06};${0.35 + (i % 3) * 0.08}`}
                dur={`${star.dur}s`}
                repeatCount="indefinite"
              />
            </use>
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
