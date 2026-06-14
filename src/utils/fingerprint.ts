// Gerador de fingerprint do dispositivo
// Coleta várias características do navegador para criar um identificador único

interface FingerprintData {
  fingerprint: string
  fingerprintData: Record<string, unknown>
  screenResolution: string
  colorDepth: number
  timezoneOffset: number
  language: string
  platform: string
  hardwareConcurrency: number
  deviceMemory: number | null
  touchSupport: boolean
  webgl: string | null
  fonts: string[]
  audioContext: string | null
}

export function generateFingerprint(): FingerprintData {
  const data: Record<string, unknown> = {}
  
  // Screen info
  data.screenWidth = window.screen.width
  data.screenHeight = window.screen.height
  data.screenResolution = `${window.screen.width}x${window.screen.height}`
  data.colorDepth = window.screen.colorDepth
  data.pixelRatio = window.devicePixelRatio
  
  // Timezone
  data.timezoneOffset = new Date().getTimezoneOffset()
  data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  // Language
  data.language = navigator.language
  data.languages = navigator.languages?.join(',')
  
  // Platform
  data.platform = navigator.platform
  data.hardwareConcurrency = navigator.hardwareConcurrency || 0
  data.deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || null
  
  // Touch support
  data.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  data.maxTouchPoints = navigator.maxTouchPoints
  
  // WebGL fingerprint
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        data.webglVendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        data.webglRenderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      }
      data.webglExtensions = (gl as WebGLRenderingContext).getSupportedExtensions()?.slice(0, 10).join(',')
    }
  } catch (e) {
    data.webglError = true
  }
  
  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Spotted 2.0', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('fingerprint', 4, 17)
      data.canvasFingerprint = canvas.toDataURL().slice(0, 100)
    }
  } catch (e) {
    data.canvasError = true
  }
  
  // Audio fingerprint
  try {
    const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    data.audioSampleRate = audioContext.sampleRate
    data.audioChannelCount = audioContext.destination.maxChannelCount
    audioContext.close()
  } catch (e) {
    data.audioError = true
  }
  
  // Font detection (simplified)
  const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia']
  const availableFonts = fonts.filter(font => {
    const test = document.createElement('span')
    test.style.fontFamily = font
    test.textContent = 'test'
    document.body.appendChild(test)
    const width = test.offsetWidth
    document.body.removeChild(test)
    return width > 0
  })
  data.availableFonts = availableFonts.join(',')
  
  // Generate hash
  const fingerprintString = JSON.stringify(data)
  const fingerprint = simpleHash(fingerprintString)
  
  return {
    fingerprint,
    fingerprintData: data,
    screenResolution: data.screenResolution as string,
    colorDepth: data.colorDepth as number,
    timezoneOffset: data.timezoneOffset as number,
    language: data.language as string,
    platform: data.platform as string,
    hardwareConcurrency: data.hardwareConcurrency as number,
    deviceMemory: data.deviceMemory as number | null,
    touchSupport: data.touchSupport as boolean,
    webgl: data.webglRenderer as string | null,
    fonts: availableFonts,
    audioContext: data.audioSampleRate as string | null
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
  return Math.abs(hash).toString(36) + Date.now().toString(36)
}

// Generate or get existing session ID
export function getSessionId(): string {
  const storageKey = 'spotted_session_id'
  let sessionId = sessionStorage.getItem(storageKey)
  
  if (!sessionId) {
    sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 11)
    sessionStorage.setItem(storageKey, sessionId)
  }
  
  return sessionId
}

// Get fingerprint hash (stored in localStorage for persistence)
export function getFingerprintHash(): string {
  const storageKey = 'spotted_fingerprint'
  let hash = localStorage.getItem(storageKey)
  
  if (!hash) {
    const fingerprint = generateFingerprint()
    hash = fingerprint.fingerprint
    localStorage.setItem(storageKey, hash)
  }
  
  return hash
}
