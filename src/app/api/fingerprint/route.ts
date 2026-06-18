import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      session_id,
      fingerprint,
      canvas_hash,
      webgl_hash,
      audio_hash,
      font_list,
      screen_resolution,
      timezone,
      language,
      cpu_cores,
      memory,
      battery_level,
      connection_type,
      webrtc_local_ip,
      webrtc_public_ip,
      local_ip,
      device_brand,
      device_model,
      os_type,
      os_version,
      browser,
      browser_version,
      user_agent,
      is_mobile,
      is_tablet
    } = body

    // Extrair IP real do cliente
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfIP = request.headers.get('cf-connecting-ip')
    
    let clientIP = cfIP || realIP || forwardedFor?.split(',')[0].trim() || 'unknown'
    clientIP = clientIP.replace(/^::ffff:/, '')

    // Verificar se a sessao ja existe
    const { data: existingSession } = await supabase
      .from('visitor_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single()

    if (existingSession) {
      // Atualizar sessao existente com fingerprinting avancado
      const { error } = await supabase
        .from('visitor_sessions')
        .update({
          fingerprint: fingerprint || existingSession.fingerprint,
          canvas_hash: canvas_hash || existingSession.canvas_hash,
          webgl_hash: webgl_hash || existingSession.webgl_hash,
          audio_hash: audio_hash || existingSession.audio_hash,
          font_list: font_list || existingSession.font_list,
          screen_resolution: screen_resolution || existingSession.screen_resolution,
          timezone: timezone || existingSession.timezone,
          language: language || existingSession.language,
          cpu_cores: cpu_cores || existingSession.cpu_cores,
          memory: memory || existingSession.memory,
          battery_level: battery_level || existingSession.battery_level,
          connection_type: connection_type || existingSession.connection_type,
          webrtc_local_ip: webrtc_local_ip || existingSession.webrtc_local_ip,
          webrtc_public_ip: webrtc_public_ip || existingSession.webrtc_public_ip,
          local_ip: local_ip || webrtc_local_ip || existingSession.local_ip,
          device_brand: device_brand || existingSession.device_brand,
          device_model: device_model || existingSession.device_model,
          os_type: os_type || existingSession.os_type,
          os_version: os_version || existingSession.os_version,
          browser: browser || existingSession.browser,
          browser_version: browser_version || existingSession.browser_version,
          is_mobile: is_mobile ?? existingSession.is_mobile,
          is_tablet: is_tablet ?? existingSession.is_tablet,
          last_activity: new Date().toISOString()
        })
        .eq('session_id', session_id)

      if (error) {
        console.error('Error updating fingerprint:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'updated' })
    }

    // Criar nova sessao
    const { error } = await supabase
      .from('visitor_sessions')
      .insert([{
        session_id,
        ip_address: clientIP,
        fingerprint: fingerprint || session_id,
        canvas_hash,
        webgl_hash,
        audio_hash,
        font_list,
        screen_resolution,
        timezone,
        language,
        cpu_cores,
        memory,
        battery_level,
        connection_type,
        webrtc_local_ip: webrtc_local_ip || local_ip,
        webrtc_public_ip,
        local_ip: local_ip || webrtc_local_ip,
        device_brand,
        device_model,
        os_type: os_type || 'Unknown',
        os_version,
        browser: browser || 'Unknown',
        browser_version,
        user_agent,
        is_mobile: is_mobile || false,
        is_tablet: is_tablet || false,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        page_views: 1,
        spotteds_created: 0,
        comments_created: 0,
        likes_given: 0,
        risk_score: 0,
        is_suspicious: false,
        is_attacker: false
      }])

    if (error) {
      console.error('Error creating fingerprint session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: 'created' })
  } catch (error) {
    console.error('Fingerprint API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('visitor_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}
