'use client'

import { useEffect, useCallback, useRef } from 'react'
import { generateFingerprint, getSessionId, getFingerprintHash } from '@/utils/fingerprint'
import { collectFingerprint, sendFingerprint } from '@/lib/fingerprint'

interface SecurityTracker {
  registerSession: () => Promise<void>
  trackActivity: (type: 'page_view' | 'spotted_created' | 'comment_created' | 'like_given' | 'report_made') => Promise<void>
  reportIncident: (eventType: string, details?: Record<string, unknown>) => Promise<void>
  sessionId: string
}

export function useSecurityTracking(): SecurityTracker {
  const sessionId = useRef<string>('')
  const isRegistered = useRef(false)
  const advancedFingerprintSent = useRef(false)
  
  // Registrar sessão
  const registerSession = useCallback(async () => {
    if (isRegistered.current) return
    
    try {
      const fingerprint = getFingerprintHash()
      const fullFingerprint = generateFingerprint()
      
      sessionId.current = getSessionId()
      
      const response = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-session',
          data: {
            sessionId: sessionId.current,
            fingerprint,
            fingerprintData: fullFingerprint.fingerprintData,
            screenResolution: fullFingerprint.screenResolution,
            colorDepth: fullFingerprint.colorDepth,
            timezoneOffset: fullFingerprint.timezoneOffset,
            language: fullFingerprint.language,
            referrer: document.referrer,
            url: window.location.href
          }
        })
      })
      
      if (response.ok) {
        isRegistered.current = true
        console.log('[Security] Session registered')
        
        // Enviar fingerprint avancado em background (nao bloqueia)
        if (!advancedFingerprintSent.current) {
          advancedFingerprintSent.current = true
          sendFingerprint(sessionId.current).catch(console.error)
        }
      }
    } catch (error) {
      console.error('[Security] Error registering session:', error)
    }
  }, [])
  
  // Trackear atividade
  const trackActivity = useCallback(async (type: 'page_view' | 'spotted_created' | 'comment_created' | 'like_given' | 'report_made') => {
    if (!sessionId.current) {
      sessionId.current = getSessionId()
    }
    
    try {
      await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-activity',
          data: {
            sessionId: sessionId.current,
            activityType: type
          }
        })
      })
    } catch (error) {
      console.error('[Security] Error tracking activity:', error)
    }
  }, [])
  
  // Reportar incidente
  const reportIncident = useCallback(async (eventType: string, details?: Record<string, unknown>) => {
    if (!sessionId.current) {
      sessionId.current = getSessionId()
    }
    
    try {
      await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report-incident',
          data: {
            sessionId: sessionId.current,
            eventType,
            severity: 'medium',
            details,
            fingerprint: getFingerprintHash()
          }
        })
      })
    } catch (error) {
      console.error('[Security] Error reporting incident:', error)
    }
  }, [])
  
  // Inicializar no mount
  useEffect(() => {
    registerSession()
    
    // Trackear page view inicial
    trackActivity('page_view')
    
    // Trackear mudanças de página (SPA navigation)
    const handleRouteChange = () => {
      trackActivity('page_view')
    }
    
    window.addEventListener('popstate', handleRouteChange)
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [registerSession, trackActivity])
  
  return {
    registerSession,
    trackActivity,
    reportIncident,
    sessionId: sessionId.current
  }
}
