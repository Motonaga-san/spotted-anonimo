'use client'

import { useEffect, useRef, useCallback } from 'react'

// Tipos
interface NetworkTrackerConfig {
  sessionId: string
  visitorId?: string
  trackPageViews?: boolean
  trackClicks?: boolean
  trackBattery?: boolean
  trackNetworkChanges?: boolean
  debug?: boolean
}

interface VisitorData {
  sessionId: string
  fingerprint: string
  fingerprintData: Record<string, unknown>
  canvasFingerprint?: string
  webglFingerprint?: string
  audioFingerprint?: string
  screenResolution: string
  colorDepth: number
  pixelRatio: number
  hardwareConcurrency: number
  deviceMemory: number | null
  batteryLevel: number | null
  isCharging: boolean | null
  language: string
  timezone: string
  timezoneOffset: number
  doNotTrack: boolean
  cookiesEnabled: boolean
  localStorageEnabled: boolean
  plugins: string[]
  fonts: string[]
  referrer: string
  url: string
}

// Hook para tracking de rede
export function useNetworkTracker(config: NetworkTrackerConfig) {
  const visitorIdRef = useRef<string | null>(config.visitorId || null)
  const pageViewsRef = useRef(0)
  const spottedsCreatedRef = useRef(0)
  const commentsCreatedRef = useRef(0)
  const likesGivenRef = useRef(0)
  const lastActivityRef = useRef<Date>(new Date())
  const isRegisteredRef = useRef(false)

  // Coletar informações avançadas do dispositivo
  const collectDeviceInfo = useCallback(async (): Promise<VisitorData> => {
    // Informações básicas
    const screenResolution = `${window.screen.width}x${window.screen.height}`
    const colorDepth = window.screen.colorDepth
    const pixelRatio = window.devicePixelRatio || 1
    const hardwareConcurrency = navigator.hardwareConcurrency || 0
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || null
    const language = navigator.language || ''
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    const timezoneOffset = new Date().getTimezoneOffset()
    const doNotTrack = navigator.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1'
    const cookiesEnabled = navigator.cookieEnabled
    const localStorageEnabled = (() => {
      try {
        localStorage.setItem('test', 'test')
        localStorage.removeItem('test')
        return true
      } catch {
        return false
      }
    })()

    // Canvas fingerprint
    let canvasFingerprint: string | undefined
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 280
      canvas.height = 60
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillStyle = '#f60'
        ctx.fillRect(100, 1, 62, 20)
        ctx.fillStyle = '#069'
        ctx.fillText('Spotted Network Monitor', 2, 15)
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
        ctx.fillText('Device Tracking', 4, 35)
        
        // Desenhar formas geométricas
        ctx.beginPath()
        ctx.arc(50, 30, 20, 0, Math.PI * 2)
        ctx.fillStyle = '#ff0'
        ctx.fill()
        
        canvasFingerprint = canvas.toDataURL().slice(0, 64)
      }
    } catch {
      // Canvas não suportado
    }

    // WebGL fingerprint
    let webglFingerprint: string | undefined
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          webglFingerprint = simpleHash(`${vendor}|${renderer}`)
        }
      }
    } catch {
      // WebGL não suportado
    }

    // Audio fingerprint
    let audioFingerprint: string | undefined
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioContext = new AudioContextClass()
      audioFingerprint = simpleHash(`${audioContext.sampleRate}|${audioContext.destination.maxChannelCount}`)
      audioContext.close()
    } catch {
      // Audio não suportado
    }

    // Battery info
    let batteryLevel: number | null = null
    let isCharging: boolean | null = null
    try {
      const nav = navigator as Navigator & { 
        getBattery?: () => Promise<{ level: number; charging: boolean }> 
      }
      if (nav.getBattery) {
        const battery = await nav.getBattery()
        batteryLevel = battery.level
        isCharging = battery.charging
      }
    } catch {
      // Battery API não suportada
    }

    // Plugins
    const plugins = Array.from(navigator.plugins || []).map(p => p.name).slice(0, 10)

    // Fonts detection
    const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Trebuchet MS', 'Comic Sans MS', 'Lucida Console']
    const availableFonts: string[] = []
    
    try {
      const testSpan = document.createElement('span')
      testSpan.textContent = 'test'
      testSpan.style.fontSize = '72px'
      testSpan.style.position = 'absolute'
      testSpan.style.left = '-9999px'
      document.body.appendChild(testSpan)
      
      fonts.forEach(font => {
        testSpan.style.fontFamily = `'${font}', monospace`
        const width = testSpan.offsetWidth
        testSpan.style.fontFamily = 'monospace'
        const monoWidth = testSpan.offsetWidth
        
        if (width !== monoWidth) {
          availableFonts.push(font)
        }
      })
      
      document.body.removeChild(testSpan)
    } catch {
      // Font detection failed
    }

    // Fingerprint data
    const fingerprintData: Record<string, unknown> = {
      screenResolution,
      colorDepth,
      pixelRatio,
      hardwareConcurrency,
      deviceMemory,
      language,
      timezone,
      platform: navigator.platform,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints,
      plugins: plugins.slice(0, 5),
      fonts: availableFonts.slice(0, 5),
      doNotTrack,
      cookiesEnabled,
      localStorageEnabled
    }

    // Generate fingerprint
    const fingerprint = simpleHash(JSON.stringify(fingerprintData) + canvasFingerprint + webglFingerprint + audioFingerprint)

    return {
      sessionId: config.sessionId,
      fingerprint,
      fingerprintData,
      canvasFingerprint,
      webglFingerprint,
      audioFingerprint,
      screenResolution,
      colorDepth,
      pixelRatio,
      hardwareConcurrency,
      deviceMemory,
      batteryLevel,
      isCharging,
      language,
      timezone,
      timezoneOffset,
      doNotTrack,
      cookiesEnabled,
      localStorageEnabled,
      plugins,
      fonts: availableFonts,
      referrer: document.referrer || '',
      url: window.location.href
    }
  }, [config.sessionId])

  // Registrar visitante
  const registerVisitor = useCallback(async () => {
    if (isRegisteredRef.current) return
    
    try {
      const deviceInfo = await collectDeviceInfo()
      
      const response = await fetch('/api/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-visitor',
          data: deviceInfo
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        visitorIdRef.current = data.visitorId
        isRegisteredRef.current = true
        
        if (config.debug) {
          console.log('[NetworkTracker] Registered visitor:', data)
        }
        
        // Se for atacante conhecido, notificar
        if (data.isKnownAttacker) {
          console.warn('[NetworkTracker] Known attacker detected!')
        }
      }
    } catch (error) {
      if (config.debug) {
        console.error('[NetworkTracker] Registration error:', error)
      }
    }
  }, [collectDeviceInfo, config.debug])

  // Atualizar atividade
  const updateActivity = useCallback(async (activityType: 'page_view' | 'spotted' | 'comment' | 'like') => {
    if (!visitorIdRef.current) return
    
    try {
      switch (activityType) {
        case 'page_view':
          pageViewsRef.current++
          break
        case 'spotted':
          spottedsCreatedRef.current++
          break
        case 'comment':
          commentsCreatedRef.current++
          break
        case 'like':
          likesGivenRef.current++
          break
      }
      
      lastActivityRef.current = new Date()
      
      await fetch('/api/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-activity',
          data: {
            sessionId: config.sessionId,
            visitorId: visitorIdRef.current,
            activityType,
            pageViews: pageViewsRef.current,
            spottedsCreated: spottedsCreatedRef.current,
            commentsCreated: commentsCreatedRef.current,
            likesGiven: likesGivenRef.current
          }
        })
      })
    } catch (error) {
      if (config.debug) {
        console.error('[NetworkTracker] Update activity error:', error)
      }
    }
  }, [config.sessionId, config.debug])

  // Finalizar sessão
  const endSession = useCallback(async () => {
    if (!config.sessionId) return
    
    try {
      const duration = Math.floor((Date.now() - lastActivityRef.current.getTime()) / 1000)
      
      await fetch('/api/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end-session',
          data: {
            sessionId: config.sessionId,
            duration
          }
        })
      })
    } catch (error) {
      if (config.debug) {
        console.error('[NetworkTracker] End session error:', error)
      }
    }
  }, [config.sessionId, config.debug])

  // Registrar automaticamente ao montar
  useEffect(() => {
    registerVisitor()
  }, [registerVisitor])

  // Track page views automaticamente
  useEffect(() => {
    if (!config.trackPageViews) return
    
    const handleRouteChange = () => {
      updateActivity('page_view')
    }
    
    // Track inicial
    handleRouteChange()
    
    // Observer para mudanças de URL
    const observer = new MutationObserver(() => {
      // Detectar mudanças no DOM que podem indicar navegação
    })
    
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => observer.disconnect()
  }, [config.trackPageViews, updateActivity])

  // Finalizar sessão ao sair
  useEffect(() => {
    const handleBeforeUnload = () => {
      endSession()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [endSession])

  return {
    visitorId: visitorIdRef.current,
    updateActivity,
    endSession,
    incrementSpotteds: () => updateActivity('spotted'),
    incrementComments: () => updateActivity('comment'),
    incrementLikes: () => updateActivity('like')
  }
}

// Simple hash function
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// Componente wrapper para usar o tracker
export function NetworkTracker({ 
  sessionId, 
  trackPageViews = true,
  debug = false,
  children 
}: { 
  sessionId: string
  trackPageViews?: boolean
  debug?: boolean
  children?: React.ReactNode 
}) {
  useNetworkTracker({ sessionId, trackPageViews, debug })
  
  return children ? <>{children}</> : null
}

export default NetworkTracker
