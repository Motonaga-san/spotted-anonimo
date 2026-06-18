import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getSupabase() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Parse User-Agent para extrair informações detalhadas
function parseUserAgent(userAgent: string) {
  const result = {
    os_type: 'Unknown',
    os_version: '',
    browser: 'Unknown',
    browser_version: '',
    device_brand: '',
    device_model: '',
    device_type: 'desktop',
    is_mobile: false,
    is_tablet: false
  }

  if (!userAgent) return result

  // Detect OS
  if (userAgent.includes('Windows NT 10')) { 
    result.os_type = 'Windows'; 
    result.os_version = '10';
    result.device_type = 'desktop';
  }
  else if (userAgent.includes('Windows NT 6.3')) { 
    result.os_type = 'Windows'; 
    result.os_version = '8.1';
    result.device_type = 'desktop';
  }
  else if (userAgent.includes('Mac OS X 10_15') || userAgent.includes('Mac OS X 10.15')) {
    result.os_type = 'macOS'
    result.os_version = '10.15'
    result.device_brand = 'Apple'
    result.device_type = 'laptop'
  }
  else if (userAgent.includes('Mac OS X 10_14') || userAgent.includes('Mac OS X 10.14')) {
    result.os_type = 'macOS'
    result.os_version = '10.14'
    result.device_brand = 'Apple'
    result.device_type = 'laptop'
  }
  else if (userAgent.includes('Mac OS X')) {
    result.os_type = 'macOS'
    result.device_brand = 'Apple'
    result.device_type = 'laptop'
  }
  else if (userAgent.includes('Android')) {
    result.os_type = 'Android'
    result.is_mobile = true
    result.device_type = 'smartphone'
    const match = userAgent.match(/Android (\d+)/)
    if (match) result.os_version = match[1]
    
    // Detect device brand for Android
    if (userAgent.includes('Samsung')) result.device_brand = 'Samsung'
    else if (userAgent.includes('Xiaomi')) result.device_brand = 'Xiaomi'
    else if (userAgent.includes('Motorola')) result.device_brand = 'Motorola'
    else if (userAgent.includes('LG')) result.device_brand = 'LG'
    else if (userAgent.includes('Huawei')) result.device_brand = 'Huawei'
    else result.device_brand = 'Android'
  }
  else if (userAgent.includes('iPhone')) {
    result.os_type = 'iOS'
    result.device_brand = 'Apple'
    result.is_mobile = true
    result.device_type = 'smartphone'
    result.device_model = 'iPhone'
    const match = userAgent.match(/OS (\d+)_/)
    if (match) result.os_version = match[1]
  }
  else if (userAgent.includes('iPad')) {
    result.os_type = 'iOS'
    result.device_brand = 'Apple'
    result.is_tablet = true
    result.device_type = 'tablet'
    result.device_model = 'iPad'
    const match = userAgent.match(/OS (\d+)_/)
    if (match) result.os_version = match[1]
  }
  else if (userAgent.includes('Linux')) { 
    result.os_type = 'Linux';
    result.device_type = 'desktop';
  }

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

  // Detect device model for Android
  if (result.os_type === 'Android') {
    const modelMatch = userAgent.match(/Android.*?;\s*([^;)]+)\s*(?:Build|;|\))/)
    if (modelMatch) {
      result.device_model = modelMatch[1].trim()
    }
  }

  return result
}

// Extrair informações de rede
function extractNetworkInfo(request: NextRequest) {
  const headers = request.headers
  
  const cfIP = headers.get('cf-connecting-ip')
  const xRealIP = headers.get('x-real-ip')
  const xForwardedFor = headers.get('x-forwarded-for')
  const vercelIP = headers.get('x-vercel-forwarded-for')
  
  let ip = 'unknown'
  let ipChain: string[] = []
  
  if (cfIP) {
    ip = cfIP.trim()
    ipChain = [cfIP]
  } else if (xRealIP) {
    ip = xRealIP.trim()
    ipChain = [xRealIP]
  } else if (xForwardedFor) {
    ipChain = xForwardedFor.split(',').map(s => s.trim())
    ip = ipChain[0]
  } else if (vercelIP) {
    ipChain = vercelIP.split(',').map(s => s.trim())
    ip = ipChain[0]
  }

  // Informações de localização do Vercel
  const country = headers.get('x-vercel-ip-country') || ''
  const city = headers.get('x-vercel-ip-city') || ''
  const region = headers.get('x-vercel-ip-country-region') || ''
  const latitude = headers.get('x-vercel-ip-latitude')
  const longitude = headers.get('x-vercel-ip-longitude')
  const timezone = headers.get('x-vercel-ip-timezone') || ''

  // ISP info (se disponível)
  const asn = headers.get('x-vercel-ip-as-number') || ''

  return {
    ip_public: ip,
    ip_chain: ipChain,
    ip_internal: ipChain.length > 1 ? ipChain[ipChain.length - 1] : null,
    x_forwarded_for: xForwardedFor,
    cf_connecting_ip: cfIP,
    country,
    city: city ? decodeURIComponent(city) : '',
    region,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    timezone,
    asn
  }
}

// Registrar visitante da mesma rede
export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'register-visitor') {
      const {
        sessionId,
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
        fonts,
        referrer,
        url
      } = data

      const networkInfo = extractNetworkInfo(request)
      const userAgent = request.headers.get('user-agent') || ''
      const parsedUA = parseUserAgent(userAgent)

      // Verificar se já existe visitante com mesmo fingerprint
      const { data: existing } = await supabase
        .from('same_network_visitors')
        .select('*')
        .eq('fingerprint', fingerprint)
        .single()

      if (existing) {
        // Atualizar visitante existente
        const updateData = {
          last_visit: new Date().toISOString(),
          total_visits: (existing.total_visits || 1) + 1,
          session_id: sessionId,
          ip_public: networkInfo.ip_public,
          screen_resolution: screenResolution,
          hardware_concurrency: hardwareConcurrency,
          device_memory: deviceMemory,
          battery_level: batteryLevel,
          is_charging: isCharging,
          updated_at: new Date().toISOString(),
          raw_navigator: data
        }

        const { error } = await supabase
          .from('same_network_visitors')
          .update(updateData)
          .eq('id', existing.id)

        if (error) {
          console.error('Error updating visitor:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Atualizar sessão de atividade
        await supabase
          .from('network_activity_sessions')
          .insert([{
            visitor_id: existing.id,
            session_id: sessionId,
            started_at: new Date().toISOString(),
            ip_address: networkInfo.ip_public,
            user_agent: userAgent
          }])

        return NextResponse.json({ 
          success: true, 
          visitorId: existing.id,
          isNew: false,
          ip: networkInfo.ip_public,
          isKnownAttacker: existing.is_known_attacker || false,
          riskScore: existing.risk_score || 0
        })
      }

      // Criar novo visitante
      const visitorData = {
        session_id: sessionId,
        fingerprint,
        ip_public: networkInfo.ip_public,
        ip_internal: networkInfo.ip_internal,
        x_forwarded_for: networkInfo.x_forwarded_for,
        user_agent: userAgent,
        os_type: parsedUA.os_type,
        os_version: parsedUA.os_version,
        browser: parsedUA.browser,
        browser_version: parsedUA.browser_version,
        device_brand: parsedUA.device_brand,
        device_model: parsedUA.device_model,
        device_type: parsedUA.device_type,
        screen_resolution: screenResolution,
        color_depth: colorDepth,
        pixel_ratio: pixelRatio,
        hardware_concurrency: hardwareConcurrency,
        device_memory: deviceMemory,
        canvas_fingerprint: canvasFingerprint,
        webgl_fingerprint: webglFingerprint,
        audio_fingerprint: audioFingerprint,
        language,
        timezone,
        timezone_offset: timezoneOffset,
        do_not_track: doNotTrack,
        cookies_enabled: cookiesEnabled,
        local_storage_enabled: localStorageEnabled,
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        total_visits: 1,
        total_page_views: 1,
        raw_navigator: data,
        raw_headers: {
          'accept-language': request.headers.get('accept-language'),
          'accept-encoding': request.headers.get('accept-encoding'),
          'accept': request.headers.get('accept'),
          'sec-ch-ua': request.headers.get('sec-ch-ua'),
          'sec-ch-ua-mobile': request.headers.get('sec-ch-ua-mobile'),
          'sec-ch-ua-platform': request.headers.get('sec-ch-ua-platform')
        }
      }

      const { data: newVisitor, error } = await supabase
        .from('same_network_visitors')
        .insert([visitorData])
        .select('id, risk_score')
        .single()

      if (error) {
        console.error('Error creating visitor:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Criar sessão de atividade
      await supabase
        .from('network_activity_sessions')
        .insert([{
          visitor_id: newVisitor.id,
          session_id: sessionId,
          started_at: new Date().toISOString(),
          ip_address: networkInfo.ip_public,
          user_agent: userAgent
        }])

      // Atualizar heatmap
      const now = new Date()
      const hour = now.getHours()
      const date = now.toISOString().split('T')[0]

      await supabase
        .from('network_activity_heatmap')
        .upsert([{
          date,
          hour,
          unique_visitors: 1,
          total_sessions: 1,
          mobile_count: parsedUA.is_mobile ? 1 : 0,
          desktop_count: parsedUA.is_mobile ? 0 : 1,
          os_counts: { [parsedUA.os_type]: 1 }
        }], {
          onConflict: 'date,hour',
          ignoreDuplicates: false
        })

      return NextResponse.json({ 
        success: true, 
        visitorId: newVisitor.id,
        isNew: true,
        ip: networkInfo.ip_public,
        location: {
          country: networkInfo.country,
          city: networkInfo.city,
          region: networkInfo.region
        }
      })
    }

    if (action === 'update-activity') {
      const { sessionId, visitorId, activityType, pageViews, spottedsCreated, commentsCreated, likesGiven } = data

      // Atualizar contadores do visitante
      const updateFields: Record<string, number | string> = {
        last_visit: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (pageViews !== undefined) updateFields.total_page_views = pageViews
      if (spottedsCreated !== undefined) updateFields.total_spotteds = spottedsCreated
      if (commentsCreated !== undefined) updateFields.total_comments = commentsCreated
      if (likesGiven !== undefined) updateFields.total_likes = likesGiven

      await supabase
        .from('same_network_visitors')
        .update(updateFields)
        .eq('id', visitorId)

      // Atualizar sessão atual
      await supabase
        .from('network_activity_sessions')
        .update({
          page_views: pageViews,
          spotteds_created: spottedsCreated,
          comments_created: commentsCreated,
          likes_given: likesGiven
        })
        .eq('session_id', sessionId)

      return NextResponse.json({ success: true })
    }

    if (action === 'track-page-view') {
      const { visitorId, path, duration } = data

      // Adicionar página ao histórico
      const { data: visitor } = await supabase
        .from('same_network_visitors')
        .select('total_page_views')
        .eq('id', visitorId)
        .single()

      if (visitor) {
        await supabase
          .from('same_network_visitors')
          .update({
            total_page_views: (visitor.total_page_views || 0) + 1,
            last_visit: new Date().toISOString()
          })
          .eq('id', visitorId)
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'end-session') {
      const { sessionId } = data

      await supabase
        .from('network_activity_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: data.duration
        })
        .eq('session_id', sessionId)

      return NextResponse.json({ success: true })
    }

    if (action === 'mark-attacker') {
      const { visitorId, isAttacker, reason } = data

      await supabase
        .from('same_network_visitors')
        .update({
          is_known_attacker: isAttacker,
          risk_score: isAttacker ? 100 : 0,
          is_suspicious: isAttacker
        })
        .eq('id', visitorId)

      // Criar alerta
      await supabase
        .from('network_alerts')
        .insert([{
          alert_type: isAttacker ? 'attacker_marked' : 'attacker_unmarked',
          severity: isAttacker ? 'danger' : 'info',
          visitor_id: visitorId,
          title: isAttacker ? 'Atacante marcado manualmente' : 'Atacante desmarcado',
          description: reason || 'Ação manual do administrador'
        }])

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Network API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Consultas de dados
export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    if (action === 'get-visitors') {
      const days = parseInt(searchParams.get('days') || '7')
      const limit = parseInt(searchParams.get('limit') || '100')
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('same_network_visitors')
        .select('*')
        .gte('last_visit', since)
        .order('last_visit', { ascending: false })
        .limit(limit)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (action === 'get-device-stats') {
      const { data, error } = await supabase
        .rpc('get_device_stats')

      if (error) {
        // Se a função não existir, fazer manualmente
        const { data: visitors, error: vError } = await supabase
          .from('same_network_visitors')
          .select('device_brand, device_model, os_type, browser, is_known_attacker, is_suspicious, total_spotteds, total_comments, risk_score')

        if (vError) return NextResponse.json({ error: vError.message }, { status: 500 })

        // Agrupar manualmente
        const stats = visitors?.reduce((acc: Record<string, unknown[]>, v) => {
          const key = `${v.device_brand || 'Unknown'}-${v.device_model || 'Unknown'}`
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(v)
          return acc
        }, {})

        return NextResponse.json(Object.entries(stats || {}).map(([key, visitors]: [string, unknown[]]) => {
          const typedVisitors = visitors as { device_brand: string; device_model: string; is_known_attacker: boolean; is_suspicious: boolean }[]
          return {
            device_brand: typedVisitors[0]?.device_brand || '',
            device_model: typedVisitors[0]?.device_model || '',
            unique_visitors: visitors.length,
            attacker_count: typedVisitors.filter(v => v.is_known_attacker).length,
            suspicious_count: typedVisitors.filter(v => v.is_suspicious).length
          }
        }))
      }

      return NextResponse.json(data)
    }

    if (action === 'get-heatmap') {
      const days = parseInt(searchParams.get('days') || '7')
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('network_activity_heatmap')
        .select('*')
        .gte('date', since)
        .order('date', { ascending: true })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (action === 'get-alerts') {
      const unreadOnly = searchParams.get('unreadOnly') === 'true'

      let query = supabase
        .from('network_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (action === 'get-stats') {
      const today = new Date().toISOString().split('T')[0]

      // Contagens paralelas
      const [total, activeToday, attackers, suspicious, alerts] = await Promise.all([
        supabase.from('same_network_visitors').select('id', { count: 'exact', head: true }),
        supabase.from('same_network_visitors').select('id', { count: 'exact', head: true }).gte('last_visit', today),
        supabase.from('same_network_visitors').select('id', { count: 'exact', head: true }).eq('is_known_attacker', true),
        supabase.from('same_network_visitors').select('id', { count: 'exact', head: true }).eq('is_suspicious', true),
        supabase.from('network_alerts').select('id', { count: 'exact', head: true }).eq('is_read', false)
      ])

      return NextResponse.json({
        totalVisitors: total.count || 0,
        activeToday: activeToday.count || 0,
        attackers: attackers.count || 0,
        suspicious: suspicious.count || 0,
        unreadAlerts: alerts.count || 0
      })
    }

    if (action === 'get-visitor') {
      const visitorId = searchParams.get('id')
      if (!visitorId) return NextResponse.json({ error: 'Missing visitor id' }, { status: 400 })

      const { data, error } = await supabase
        .from('same_network_visitors')
        .select('*')
        .eq('id', visitorId)
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (action === 'search-visitors') {
      const query = searchParams.get('q')
      if (!query) return NextResponse.json({ error: 'Missing search query' }, { status: 400 })

      const { data, error } = await supabase
        .from('same_network_visitors')
        .select('*')
        .or(`device_brand.ilike.%${query},device_model.ilike.%${query},os_type.ilike.%${query},browser.ilike.%${query},fingerprint.ilike.%${query}`)
        .limit(20)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Network API GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
