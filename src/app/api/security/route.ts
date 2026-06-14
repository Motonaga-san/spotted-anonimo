import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getSupabase() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Parse User-Agent para extrair informações
function parseUserAgent(userAgent: string) {
  const result = {
    os_type: 'Unknown',
    os_version: '',
    browser: 'Unknown',
    browser_version: '',
    device_brand: '',
    device_model: '',
    is_mobile: false,
    is_tablet: false,
    is_bot: false
  }

  if (!userAgent) return result

  // Detect OS
  if (userAgent.includes('Windows NT 10')) { result.os_type = 'Windows'; result.os_version = '10' }
  else if (userAgent.includes('Windows NT 6.3')) { result.os_type = 'Windows'; result.os_version = '8.1' }
  else if (userAgent.includes('Windows NT 6.2')) { result.os_type = 'Windows'; result.os_version = '8' }
  else if (userAgent.includes('Windows NT 6.1')) { result.os_type = 'Windows'; result.os_version = '7' }
  else if (userAgent.includes('Mac OS X 10_15') || userAgent.includes('Mac OS X 10.15')) {
    result.os_type = 'macOS'
    result.os_version = '10.15'
    result.device_brand = 'Apple'
  }
  else if (userAgent.includes('Mac OS X 10_14') || userAgent.includes('Mac OS X 10.14')) {
    result.os_type = 'macOS'
    result.os_version = '10.14'
    result.device_brand = 'Apple'
  }
  else if (userAgent.includes('Mac OS X')) {
    result.os_type = 'macOS'
    result.device_brand = 'Apple'
  }
  else if (userAgent.includes('Android')) {
    result.os_type = 'Android'
    result.is_mobile = true
    const match = userAgent.match(/Android (\d+)/)
    if (match) result.os_version = match[1]
  }
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    result.os_type = 'iOS'
    result.device_brand = 'Apple'
    result.is_mobile = userAgent.includes('iPhone')
    result.is_tablet = userAgent.includes('iPad')
    const match = userAgent.match(/OS (\d+)_/)
    if (match) result.os_version = match[1]
  }
  else if (userAgent.includes('Linux')) { result.os_type = 'Linux' }

  // Detect Browser
  if (userAgent.includes('Firefox/')) {
    result.browser = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    if (match) result.browser_version = match[1]
  }
  else if (userAgent.includes('Edg/')) {
    result.browser = 'Edge'
    const match = userAgent.match(/Edg\/(\d+)/)
    if (match) result.browser_version = match[1]
  }
  else if (userAgent.includes('Chrome/')) {
    result.browser = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    if (match) result.browser_version = match[1]
  }
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    result.browser = 'Safari'
    const match = userAgent.match(/Version\/(\d+)/)
    if (match) result.browser_version = match[1]
  }

  // Detect bots
  if (userAgent.toLowerCase().match(/bot|crawler|spider|scraper|curl|wget|python/)) {
    result.is_bot = true
  }

  // Detect device model for mobile
  if (result.os_type === 'Android') {
    const modelMatch = userAgent.match(/Android.*?;\s*([^;)]+)\s*(?:Build|;|\))/)
    if (modelMatch) {
      result.device_model = modelMatch[1].trim()
    }
  }
  if (userAgent.includes('iPhone')) {
    result.device_model = 'iPhone'
  }
  if (userAgent.includes('iPad')) {
    result.device_model = 'iPad'
  }

  return result
}

// Extrair IP real do visitante
function extractRealIP(request: NextRequest) {
  const headers = request.headers
  
  // Ordem de prioridade para IP real
  const cfIP = headers.get('cf-connecting-ip')
  const xRealIP = headers.get('x-real-ip')
  const xForwardedFor = headers.get('x-forwarded-for')
  const vercelIP = headers.get('x-vercel-forwarded-for')
  
  let ip = 'unknown'
  let xForwardedChain = ''
  
  if (cfIP) {
    ip = cfIP.trim()
  } else if (xRealIP) {
    ip = xRealIP.trim()
  } else if (xForwardedFor) {
    xForwardedChain = xForwardedFor
    ip = xForwardedFor.split(',')[0].trim()
  } else if (vercelIP) {
    ip = vercelIP.split(',')[0].trim()
  }
  
  return {
    ip,
    xForwardedFor: xForwardedChain,
    cfConnectingIP: cfIP,
    realIP: xRealIP
  }
}

// Registrar ou atualizar sessão de visitante
export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  const body = await request.json()
  const { action, data } = body

  if (action === 'register-session') {
    const { sessionId, fingerprint, fingerprintData, screenResolution, colorDepth, timezoneOffset, language, referrer, url } = data
    
    const ipInfo = extractRealIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const parsedUA = parseUserAgent(userAgent)
    
    // Obter localização do Vercel headers
    const country = request.headers.get('x-vercel-ip-country') || ''
    const city = request.headers.get('x-vercel-ip-city') || ''
    const region = request.headers.get('x-vercel-ip-country-region') || ''
    const latitude = request.headers.get('x-vercel-ip-latitude')
    const longitude = request.headers.get('x-vercel-ip-longitude')
    const timezone = request.headers.get('x-vercel-ip-timezone') || ''

    const sessionData = {
      session_id: sessionId,
      ip_address: ipInfo.ip,
      ip_public: ipInfo.ip,
      x_forwarded_for: ipInfo.xForwardedFor,
      cf_connecting_ip: ipInfo.cfConnectingIP,
      real_ip: ipInfo.realIP,
      fingerprint,
      fingerprint_data: fingerprintData,
      user_agent: userAgent,
      ...parsedUA,
      country,
      city,
      region,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      timezone,
      screen_resolution: screenResolution,
      color_depth: colorDepth,
      timezone_offset: timezoneOffset,
      language,
      referrer,
      first_url: url,
      started_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    }

    const { error } = await supabase
      .from('visitor_sessions')
      .upsert([sessionData], { onConflict: 'session_id' })

    if (error) {
      console.error('Error registering session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Verificar se é um IP/fingerprint suspeito
    const { data: riskData } = await supabase
      .from('visitor_sessions')
      .select('risk_score, is_attacker')
      .eq('ip_address', ipInfo.ip)
      .eq('is_attacker', true)
      .limit(1)

    return NextResponse.json({ 
      success: true, 
      ip: ipInfo.ip,
      isKnownAttacker: riskData && riskData.length > 0
    })
  }

  if (action === 'update-activity') {
    const { sessionId, activityType } = data
    
    // Mapeia tipo de atividade para campo a incrementar
    const fieldMap: Record<string, string> = {
      'page_view': 'page_views',
      'spotted_created': 'spotteds_created',
      'comment_created': 'comments_created',
      'like_given': 'likes_given',
      'report_made': 'reports_made'
    }
    
    const fieldToUpdate = fieldMap[activityType]
    
    if (fieldToUpdate) {
      // Buscar valor atual e incrementar
      const { data: existing } = await supabase
        .from('visitor_sessions')
        .select(fieldToUpdate)
        .eq('session_id', sessionId)
        .single()

      if (existing) {
        const existingData = existing as unknown as Record<string, unknown>
        const currentValue = (existingData[fieldToUpdate] as number) || 0
        await supabase
          .from('visitor_sessions')
          .update({ 
            [fieldToUpdate]: currentValue + 1,
            'last_activity': new Date().toISOString()
          })
          .eq('session_id', sessionId)
      }
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'report-incident') {
    const { sessionId, eventType, severity, action: incidentAction, targetId, targetType, contentPreview, details, fingerprint } = data
    
    const ipInfo = extractRealIP(request)
    
    // Registrar evento de segurança
    const { error } = await supabase
      .from('security_events')
      .insert([{
        event_type: eventType,
        severity,
        session_id: sessionId,
        ip_address: ipInfo.ip,
        fingerprint: fingerprint,
        user_agent: request.headers.get('user-agent'),
        action: incidentAction,
        target_id: targetId,
        target_type: targetType,
        content_preview: contentPreview,
        details
      }])

    // Marcar sessão como suspeita se necessário
    if (severity === 'danger' || severity === 'critical') {
      await supabase
        .from('visitor_sessions')
        .update({ is_suspicious: true, risk_score: 80 })
        .eq('session_id', sessionId)
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// Obter estatísticas e alertas
export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'get-suspicious') {
    const hours = parseInt(searchParams.get('hours') || '24')
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('visitor_sessions')
      .select('*')
      .or('is_suspicious.eq.true,is_attacker.eq.true,risk_score.gte.50')
      .gte('last_activity', since)
      .order('risk_score', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (action === 'get-attackers') {
    const { data, error } = await supabase
      .from('attacker_summary')
      .select('*')
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (action === 'get-correlation') {
    const { data, error } = await supabase
      .from('attacker_network_correlation')
      .select('*')
      .order('attack_count', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (action === 'get-stats') {
    const days = parseInt(searchParams.get('days') || '7')
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const [sessions, events, attackers] = await Promise.all([
      supabase.from('visitor_sessions').select('ip_address, os_type, country, is_attacker').gte('started_at', since),
      supabase.from('security_events').select('event_type, severity').gte('created_at', since),
      supabase.from('visitor_sessions').select('ip_address').eq('is_attacker', true).gte('started_at', since)
    ])

    // Agrupar por OS
    const byOS = sessions.data?.reduce((acc: Record<string, number>, s) => {
      acc[s.os_type || 'Unknown'] = (acc[s.os_type || 'Unknown'] || 0) + 1
      return acc
    }, {}) || {}

    // Agrupar por país
    const byCountry = sessions.data?.reduce((acc: Record<string, number>, s) => {
      if (s.country) acc[s.country] = (acc[s.country] || 0) + 1
      return acc
    }, {}) || {}

    // IPs únicos de atacantes
    const attackerIPs = [...new Set(attackers.data?.map(a => a.ip_address) || [])]

    return NextResponse.json({
      totalSessions: sessions.data?.length || 0,
      totalEvents: events.data?.length || 0,
      attackerIPs,
      byOS,
      byCountry,
      uniqueIPs: [...new Set(sessions.data?.map(s => s.ip_address) || [])].length
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
