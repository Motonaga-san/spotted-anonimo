// Advanced Fingerprinting Script
// Este script coleta dados avancados para identificacao unica de dispositivos

interface FingerprintData {
  fingerprint: string
  canvas_hash: string
  webgl_hash: string
  audio_hash: string
  font_list: string[]
  screen_resolution: string
  timezone: string
  language: string
  cpu_cores: number
  memory: number
  battery_level: number
  connection_type: string
  webrtc_local_ip: string | null
  webrtc_public_ip: string | null
  local_ip: string | null
  device_brand: string
  device_model: string
  os_type: string
  os_version: string
  browser: string
  browser_version: string
  user_agent: string
  is_mobile: boolean
  is_tablet: boolean
}

// Gerar hash simples
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

// Canvas Fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 50
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    
    // Desenhar padrao unico
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(0, 0, 200, 50)
    ctx.fillStyle = '#069'
    ctx.fillText('Fingerprint', 2, 2)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Canvas', 4, 20)
    
    // Adicionar formas geometricas
    ctx.beginPath()
    ctx.arc(100, 25, 20, 0, Math.PI * 2)
    ctx.fill()
    
    return simpleHash(canvas.toDataURL())
  } catch {
    return ''
  }
}

// WebGL Fingerprint
function getWebGLFingerprint(): { hash: string; vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return { hash: '', vendor: '', renderer: '' }
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
    const vendor = debugInfo ? (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : ''
    const renderer = debugInfo ? (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ''
    
    // Coletar parametros WebGL
    const params = [
      (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).VENDOR),
      (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).RENDERER),
      (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).VERSION),
      (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).SHADING_LANGUAGE_VERSION),
      vendor,
      renderer
    ].filter(Boolean).join('|')
    
    return { hash: simpleHash(params), vendor, renderer }
  } catch {
    return { hash: '', vendor: '', renderer: '' }
  }
}

// Audio Fingerprint
async function getAudioFingerprint(): Promise<string> {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const analyser = audioContext.createAnalyser()
    const gain = audioContext.createGain()
    const processor = audioContext.createScriptProcessor(4096, 1, 1)

    gain.gain.value = 0
    oscillator.type = 'triangle'
    oscillator.frequency.value = 10000

    oscillator.connect(analyser)
    analyser.connect(processor)
    processor.connect(gain)
    gain.connect(audioContext.destination)

    oscillator.start(0)

    return new Promise((resolve) => {
      processor.onaudioprocess = (event) => {
        const data = event.inputBuffer.getChannelData(0)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          sum += Math.abs(data[i])
        }
        oscillator.stop()
        audioContext.close()
        resolve(simpleHash(sum.toString()))
      }
    })
  } catch {
    return ''
  }
}

// Font Detection
function getFonts(): string[] {
  const baseFonts = ['monospace', 'sans-serif', 'serif']
  const testFonts = [
    'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
    'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Palatino Linotype',
    'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Symbol',
    'Webdings', 'Wingdings', 'Wingdings 2', 'Wingdings 3',
    'MS Sans Serif', 'MS Serif', 'New York', 'Helvetica', 'Geneva',
    'Monaco', 'Chicago', 'Cairo', 'Bangalore', 'Calcutta', 'Bombay',
    'PingFang SC', 'PingFang TC', 'PingFang HK', 'Microsoft YaHei',
    'Microsoft JhengHei', 'SimSun', 'SimHei', 'NSimSun', 'FangSong',
    'KaiTi', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji'
  ]
  
  const testString = 'mmmmmmmmmmlli'
  const testSize = '72px'
  const h = document.getElementsByTagName('body')[0]
  const span = document.createElement('span')
  span.style.fontSize = testSize
  span.innerHTML = testString
  span.style.position = 'absolute'
  span.style.left = '-9999px'
  
  const baseFontWidths: { [key: string]: number } = {}
  
  baseFonts.forEach(baseFont => {
    span.style.fontFamily = baseFont
    h.appendChild(span)
    baseFontWidths[baseFont] = span.offsetWidth
    h.removeChild(span)
  })
  
  const detectedFonts: string[] = []
  
  testFonts.forEach(font => {
    let detected = false
    baseFonts.forEach(baseFont => {
      span.style.fontFamily = `${font}, ${baseFont}`
      h.appendChild(span)
      const width = span.offsetWidth
      h.removeChild(span)
      if (baseFontWidths[baseFont] !== width) {
        detected = true
      }
    })
    if (detected) {
      detectedFonts.push(font)
    }
  })
  
  return detectedFonts
}

// WebRTC IP Detection
async function getWebRTCIPs(): Promise<{ local: string | null; public: string | null }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ local: null, public: null }), 5000)
    
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      
      pc.createDataChannel('')
      
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          clearTimeout(timeout)
          resolve({ local: null, public: null })
        })
      
      let localIP: string | null = null
      let publicIP: string | null = null
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate
          
          // IPv4 match
          const ipv4Match = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g)
          if (ipv4Match) {
            ipv4Match.forEach(ip => {
              if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
                if (!localIP) localIP = ip
              } else if (!ip.startsWith('169.254.')) {
                if (!publicIP) publicIP = ip
              }
            })
          }
          
          // Se encontrou ambos, resolver
          if (localIP && publicIP) {
            clearTimeout(timeout)
            pc.close()
            resolve({ local: localIP, public: publicIP })
          }
        }
      }
      
      // Timeout parcial - resolver com o que tem
      setTimeout(() => {
        if (localIP || publicIP) {
          clearTimeout(timeout)
          pc.close()
          resolve({ local: localIP, public: publicIP })
        }
      }, 2000)
      
    } catch {
      clearTimeout(timeout)
      resolve({ local: null, public: null })
    }
  })
}

// Parse User Agent
function parseUserAgent(): { 
  os_type: string
  os_version: string
  browser: string
  browser_version: string
  device_brand: string
  device_model: string
  is_mobile: boolean
  is_tablet: boolean
} {
  const ua = navigator.userAgent
  
  let os_type = 'Unknown'
  let os_version = ''
  let browser = 'Unknown'
  let browser_version = ''
  let device_brand = ''
  let device_model = ''
  let is_mobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  let is_tablet = /iPad|Tablet|PlayBook|Silk/i.test(ua)
  
  // Detect OS
  if (/Windows/i.test(ua)) {
    os_type = 'Windows'
    const match = ua.match(/Windows NT (\d+\.?\d*)/)
    os_version = match ? match[1] : ''
  } else if (/Mac OS X/i.test(ua)) {
    os_type = is_tablet ? 'iPadOS' : 'macOS'
    const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/)
    os_version = match ? match[1].replace(/_/g, '.') : ''
    device_brand = 'Apple'
  } else if (/iPhone/i.test(ua)) {
    os_type = 'iOS'
    const match = ua.match(/iPhone OS (\d+[._]\d+[._]?\d*)/)
    os_version = match ? match[1].replace(/_/g, '.') : ''
    device_brand = 'Apple'
    device_model = 'iPhone'
    is_mobile = true
  } else if (/iPad/i.test(ua)) {
    os_type = 'iOS'
    const match = ua.match(/iPad.*OS (\d+[._]\d+[._]?\d*)/)
    os_version = match ? match[1].replace(/_/g, '.') : ''
    device_brand = 'Apple'
    device_model = 'iPad'
    is_tablet = true
  } else if (/Android/i.test(ua)) {
    os_type = 'Android'
    const match = ua.match(/Android (\d+\.?\d*\.?\d*)/)
    os_version = match ? match[1] : ''
    // Detect device brand from UA
    const brandMatch = ua.match(/(Samsung|Huawei|Xiaomi|OnePlus|Pixel|LG|Sony|Motorola|Nokia|HTC|ZTE|Oppo|Vivo|Realme)/i)
    if (brandMatch) device_brand = brandMatch[1]
  } else if (/Linux/i.test(ua)) {
    os_type = 'Linux'
  } else if (/CrOS/i.test(ua)) {
    os_type = 'ChromeOS'
  }
  
  // Detect Browser
  if (/Edg\//i.test(ua)) {
    browser = 'Edge'
    const match = ua.match(/Edg\/(\d+\.?\d*)/)
    browser_version = match ? match[1] : ''
  } else if (/Chrome\//i.test(ua)) {
    browser = 'Chrome'
    const match = ua.match(/Chrome\/(\d+\.?\d*\.?\d*\.?\d*)/)
    browser_version = match ? match[1] : ''
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Safari'
    const match = ua.match(/Version\/(\d+\.?\d*)/)
    browser_version = match ? match[1] : ''
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox'
    const match = ua.match(/Firefox\/(\d+\.?\d*)/)
    browser_version = match ? match[1] : ''
  } else if (/Opera|OPR\//i.test(ua)) {
    browser = 'Opera'
    const match = ua.match(/(?:Opera|OPR)\/(\d+\.?\d*)/)
    browser_version = match ? match[1] : ''
  }
  
  return { os_type, os_version, browser, browser_version, device_brand, device_model, is_mobile, is_tablet }
}

// Main fingerprint collection
export async function collectFingerprint(): Promise<FingerprintData> {
  const parsedUA = parseUserAgent()
  const webgl = getWebGLFingerprint()
  const webrtcIPs = await getWebRTCIPs()
  
  // Se WebRTC detectou device brand/model via GPU (para Apple)
  if (webgl.renderer && !parsedUA.device_brand) {
    if (webgl.renderer.includes('Apple')) {
      parsedUA.device_brand = 'Apple'
    }
  }
  
  return {
    fingerprint: generateDeviceFingerprint(parsedUA),
    canvas_hash: getCanvasFingerprint(),
    webgl_hash: webgl.hash,
    audio_hash: await getAudioFingerprint(),
    font_list: getFonts(),
    screen_resolution: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    cpu_cores: navigator.hardwareConcurrency || 0,
    memory: (navigator as any).deviceMemory || 0,
    battery_level: 0,
    connection_type: (navigator as any).connection?.effectiveType || '',
    webrtc_local_ip: webrtcIPs.local,
    webrtc_public_ip: webrtcIPs.public,
    local_ip: webrtcIPs.local,
    device_brand: parsedUA.device_brand,
    device_model: parsedUA.device_model,
    os_type: parsedUA.os_type,
    os_version: parsedUA.os_version,
    browser: parsedUA.browser,
    browser_version: parsedUA.browser_version,
    user_agent: navigator.userAgent,
    is_mobile: parsedUA.is_mobile,
    is_tablet: parsedUA.is_tablet
  }
}

function generateDeviceFingerprint(parsedUA: ReturnType<typeof parseUserAgent>): string {
  const components = [
    parsedUA.os_type,
    parsedUA.browser,
    navigator.language,
    `${window.screen.width}x${window.screen.height}`,
    navigator.hardwareConcurrency,
    new Date().getTimezoneOffset()
  ]
  return simpleHash(components.join('|'))
}

// Send fingerprint to server
export async function sendFingerprint(sessionId: string): Promise<void> {
  try {
    const data = await collectFingerprint()
    
    await fetch('/api/fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        ...data
      })
    })
  } catch (error) {
    console.error('Failed to send fingerprint:', error)
  }
}
