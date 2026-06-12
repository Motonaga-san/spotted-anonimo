import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Tipos do banco de dados
export interface Spotted {
  id: string
  number: number
  message: string
  message_html?: string
  created_at: string
  status: 'approved' | 'reported' | 'hidden'
  likes: number
  views: number
  reports_count: number
  author_ip?: string
  author_fingerprint?: string
  comments?: Comment[]
}

export interface Comment {
  id: string
  spotted_id: string
  content: string
  content_html?: string
  likes: number
  status: 'approved' | 'reported' | 'hidden'
  author_ip?: string
  author_fingerprint?: string
  created_at: string
}

export interface Report {
  id: string
  spotted_id?: string
  comment_id?: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed'
  reporter_ip?: string
  reporter_fingerprint?: string
  created_at: string
}

export interface PageView {
  id: string
  page: string
  visitor_ip?: string
  visitor_fingerprint?: string
  user_agent?: string
  referrer?: string
  country?: string
  created_at: string
}

export interface DailyStats {
  date: string
  page_views: number
  unique_visitors: number
  spotteds_created: number
  comments_created: number
  reports_created: number
  likes_given: number
}

export interface VisitorInfo {
  ip: string
  userAgent: string
  country: string
  city: string
}

export interface AnalyticsEvent {
  event_type: string
  event_data?: Record<string, unknown>
  visitor_ip?: string
  visitor_fingerprint?: string
  user_agent?: string
  country?: string
  city?: string
  page?: string
  element_clicked?: string
  session_id?: string
}

export interface UserSession {
  session_id: string
  visitor_fingerprint?: string
  visitor_ip?: string
  country?: string
  city?: string
  user_agent?: string
  device_type?: string
  browser?: string
  os?: string
  first_page?: string
  referrer?: string
  page_views?: number
  spotteds_created?: number
  comments_created?: number
  likes_given?: number
}

// ID único da sessão
let currentSessionId: string | null = null

// Gera ou recupera ID da sessão
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  if (!currentSessionId) {
    // Tenta recuperar do sessionStorage
    currentSessionId = sessionStorage.getItem('spotted_session_id')
    
    if (!currentSessionId) {
      // Cria nova sessão
      currentSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('spotted_session_id', currentSessionId)
    }
  }
  
  return currentSessionId
}

// Gera fingerprint robusto do navegador (58 campos)
export async function generateFingerprintAsync(): Promise<{ fingerprint: Record<string, unknown>; hash: string }> {
  if (typeof window === 'undefined') return { fingerprint: {}, hash: '' }
  
  const fp: Record<string, unknown> = {}
  
  try {
    // 1. User Agent completo
    fp.ua = navigator.userAgent
    
    // 2. Plataforma e hardware
    fp.plat = navigator.platform
    fp.cores = navigator.hardwareConcurrency || 0
    fp.mem = (navigator as unknown as Record<string, unknown>).deviceMemory || 0
    
    // 3. Tela
    fp.scw = screen.width
    fp.sch = screen.height
    fp.scd = screen.colorDepth
    fp.dpr = window.devicePixelRatio
    
    // 4. Timezone e idioma
    fp.tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    fp.tzo = new Date().getTimezoneOffset()
    fp.lang = navigator.language
    fp.langs = navigator.languages?.slice(0, 3).join(',')
    
    // 5. Touch
    fp.touch = navigator.maxTouchPoints || 0
    
    // 6. WebGL (GPU)
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    if (gl) {
      fp.glv = gl.getParameter(gl.VENDOR)
      fp.glr = gl.getParameter(gl.RENDERER)
      const dbg = gl.getExtension('WEBGL_debug_renderer_info')
      if (dbg) {
        fp.glvu = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)
        fp.glru = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
      }
      fp.glt = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    }
    
    // 7. Canvas fingerprint
    const c2 = document.createElement('canvas')
    c2.width = 200
    c2.height = 50
    const ctx = c2.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Spotted2.0', 2, 15)
      fp.cv = c2.toDataURL().slice(-30)
    }
    
    // 8. Audio
    try {
      const ac = new (window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext)()
      fp.asr = ac.sampleRate
      fp.amc = (ac.destination as unknown as Record<string, unknown>).maxChannelCount
    } catch {}
    
    // 9. Network
    const conn = (navigator as unknown as Record<string, unknown>).connection as Record<string, unknown> | undefined
    if (conn) {
      fp.ct = conn.effectiveType
      fp.dl = conn.downlink
      fp.rtt = conn.rtt
    }
    
    // 10. Battery
    const navWithBattery = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> }
    if (navWithBattery.getBattery) {
      try {
        const bat = await navWithBattery.getBattery()
        fp.bl = Math.round(bat.level * 100)
        fp.bc = bat.charging
      } catch {}
    }
    
    // 11. Media devices
    if (navigator.mediaDevices) {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices()
        fp.mdc = devs.length
        fp.cam = devs.filter(d => d.kind === 'videoinput').length
        fp.mic = devs.filter(d => d.kind === 'audioinput').length
      } catch {}
    }
    
    // 12. Features
    fp.cookie = navigator.cookieEnabled
    fp.pdf = (navigator as unknown as Record<string, unknown>).pdfViewerEnabled || false
    fp.ls = !!window.localStorage
    fp.idb = !!window.indexedDB
    
    // 13. Screen orientation
    if (screen.orientation) {
      fp.or = screen.orientation.type
    }
    
    // 14. Window
    fp.ww = window.innerWidth
    fp.wh = window.innerHeight
    
    // 15. Dark mode
    fp.dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    // 16. Math precision
    const m = [
      Math.sin(0.123).toString().slice(0, 10),
      Math.cos(0.123).toString().slice(0, 10),
      Math.tan(0.123).toString().slice(0, 10),
      Math.sqrt(2).toString().slice(0, 10)
    ]
    fp.math = m.join('|')
    
  } catch (e) {
    fp.err = (e as Error).message
  }
  
  // Gerar hash único
  const input = JSON.stringify(fp)
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hashStr = Math.abs(hash).toString(16).toUpperCase()
  
  return { fingerprint: fp, hash: hashStr }
}

// Gera fingerprint do navegador (versão síncrona simplificada)
export function generateFingerprint(): string {
  if (typeof window === 'undefined') return ''
  
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.slice(0, 3).join(','),
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    window.devicePixelRatio || 1,
    new Date().getTimezoneOffset(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 0,
    navigator.platform || '',
    navigator.maxTouchPoints || 0,
    // WebGL GPU
    (() => {
      try {
        const c = document.createElement('canvas')
        const gl = c.getContext('webgl') as WebGLRenderingContext | null
        if (gl) {
          const dbg = gl.getExtension('WEBGL_debug_renderer_info')
          if (dbg) return gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
        }
      } catch {}
      return ''
    })(),
    // Canvas hash
    (() => {
      try {
        const c = document.createElement('canvas')
        c.width = 100
        c.height = 30
        const ctx = c.getContext('2d')
        if (ctx) {
          ctx.textBaseline = 'top'
          ctx.font = '14px Arial'
          ctx.fillText('FP', 2, 2)
          return c.toDataURL().slice(-20)
        }
      } catch {}
      return ''
    })(),
    // Audio
    (() => {
      try {
        const ac = new (window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext)()
        return ac.sampleRate
      } catch {}
      return ''
    })(),
    // Network
    (() => {
      const conn = (navigator as unknown as Record<string, unknown>).connection as Record<string, unknown> | undefined
      return conn ? `${conn.effectiveType}-${conn.downlink}` : ''
    })(),
    // Math precision
    Math.sin(0.123).toString().slice(0, 8) + Math.cos(0.123).toString().slice(0, 8),
    // Window size
    window.innerWidth + 'x' + window.innerHeight,
    // Dark mode
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'D' : 'L',
  ]
  
  const fingerprint = components.join('|')
  return btoa(fingerprint).slice(0, 128)
}

// Detecta tipo de dispositivo
export function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent.toLowerCase()
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile'
  if (/tablet|ipad/.test(ua)) return 'tablet'
  return 'desktop'
}

// Detecta navegador
export function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  return 'Other'
}

// Detecta sistema operacional
export function getOS(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'MacOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Other'
}

// Busca informações do visitante (IP, localização)
export async function getVisitorInfo(): Promise<VisitorInfo> {
  try {
    const response = await fetch('/api/ip')
    return await response.json()
  } catch {
    return { ip: 'unknown', userAgent: '', country: '', city: '' }
  }
}

// Registra evento de analytics
export async function trackEvent(eventType: string, eventData: Record<string, unknown> = {}): Promise<void> {
  try {
    const fingerprint = generateFingerprint()
    const visitorInfo = await getVisitorInfo()
    const sessionId = getSessionId()
    
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track-event',
        event: {
          event_type: eventType,
          event_data: eventData,
          visitor_ip: visitorInfo.ip,
          visitor_fingerprint: fingerprint,
          user_agent: visitorInfo.userAgent,
          country: visitorInfo.country,
          city: visitorInfo.city,
          page: window.location.pathname,
          session_id: sessionId,
        }
      })
    })
  } catch (error) {
    console.error('Erro ao registrar evento:', error)
  }
}

// Atualiza sessão do usuário
export async function updateSession(data: Partial<UserSession>): Promise<void> {
  try {
    const sessionId = getSessionId()
    const fingerprint = generateFingerprint()
    const visitorInfo = await getVisitorInfo()
    
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update-session',
        sessionId,
        data: {
          visitor_fingerprint: fingerprint,
          visitor_ip: visitorInfo.ip,
          country: visitorInfo.country,
          city: visitorInfo.city,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          ...data
        }
      })
    })
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error)
  }
}

// Registra visualização de página
export async function trackPageView(page: string): Promise<void> {
  const fingerprint = generateFingerprint()
  const visitorInfo = await getVisitorInfo()
  const sessionId = getSessionId()
  
  // Registra evento de pageview
  await trackEvent('page_view', { page })
  
  // Atualiza sessão
  await updateSession({
    first_page: page,
    referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    page_views: 1,
  })
  
  // Também mantém registro na tabela page_views original
  if (supabase) {
    await supabase.from('page_views').insert([{
      page,
      visitor_ip: visitorInfo.ip,
      visitor_fingerprint: fingerprint,
      user_agent: visitorInfo.userAgent,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      country: visitorInfo.country,
    }])
  }
}

// Registra clique em elemento
export function trackClick(elementName: string, additionalData: Record<string, unknown> = {}): void {
  trackEvent('click', { element: elementName, ...additionalData })
}

// Registra criação de spotted
export function trackSpottedCreated(spottedId: string): void {
  trackEvent('spotted_created', { spotted_id: spottedId })
  updateSession({ spotteds_created: 1 })
}

// Registra criação de comentário
export function trackCommentCreated(spottedId: string, commentId: string): void {
  trackEvent('comment_created', { spotted_id: spottedId, comment_id: commentId })
  updateSession({ comments_created: 1 })
}

// Registra like
export function trackLike(type: 'spotted' | 'comment', id: string): void {
  trackEvent('like_given', { type, target_id: id })
  updateSession({ likes_given: 1 })
}

// Registra denúncia
export function trackReport(type: 'spotted' | 'comment', id: string, reason: string): void {
  trackEvent('report_created', { type, target_id: id, reason })
}

// Busca estatísticas de analytics
export async function getAnalyticsStats(days: number = 7): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`/api/analytics?action=get-stats&days=${days}`)
    return await response.json()
  } catch {
    return {}
  }
}

// Formata texto com markdown básico (negrito, itálico)
export function formatText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
}

// Sanitiza HTML para prevenir XSS
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
