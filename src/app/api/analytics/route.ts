import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getSupabase() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  const body = await request.json()
  const { action, event, sessionId, data } = body

  if (action === 'track-event' && event) {
    // Usar security_events como tabela unificada de eventos
    const { error } = await supabase
      .from('security_events')
      .insert([{
        event_type: event.event_type || event.type || 'unknown',
        session_id: sessionId,
        ip_address: event.ip_address,
        fingerprint: event.fingerprint,
        action: event.action || 'track',
        details: event
      }])

    if (error) {
      console.error('Erro ao registrar evento:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'update-session' && sessionId && data) {
    // Usar visitor_sessions como tabela unificada de sessões
    const { error } = await supabase
      .from('visitor_sessions')
      .upsert([{
        session_id: sessionId,
        ...data,
        last_activity: new Date().toISOString()
      }], { onConflict: 'session_id' })

    if (error) {
      console.error('Erro ao atualizar sessão:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'get-stats') {
    const days = parseInt(searchParams.get('days') || '7')
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Buscar estatísticas em paralelo usando tabelas unificadas
    const [eventsResult, sessionsResult, spottedsResult, commentsResult] = await Promise.all([
      supabase.from('security_events').select('*').gte('created_at', startDate),
      supabase.from('visitor_sessions').select('*').gte('started_at', startDate),
      supabase.from('spotteds').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true })
    ])

    const events = eventsResult.data || []
    const sessions = sessionsResult.data || []

    // Calcular métricas
    const stats = {
      totalEvents: events.length,
      totalSessions: sessions.length,
      totalSpotteds: spottedsResult.count || 0,
      totalComments: commentsResult.count || 0,
      totalLikes: sessions.reduce((sum, s) => sum + (s.likes_given || 0), 0),
      uniqueVisitors: new Set(sessions.map(s => s.fingerprint).filter(Boolean)).size,
      uniqueIPs: new Set(sessions.map(s => s.ip_address).filter(Boolean)).size,
      eventsByType: events.reduce((acc: Record<string, number>, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1
        return acc
      }, {}),
      byOS: sessions.reduce((acc: Record<string, number>, s) => {
        if (s.os_type) acc[s.os_type] = (acc[s.os_type] || 0) + 1
        return acc
      }, {}),
      byBrowser: sessions.reduce((acc: Record<string, number>, s) => {
        if (s.browser) acc[s.browser] = (acc[s.browser] || 0) + 1
        return acc
      }, {}),
      topCountries: sessions.reduce((acc: Record<string, number>, s) => {
        if (s.country) acc[s.country] = (acc[s.country] || 0) + 1
        return acc
      }, {}),
      avgPageViewsPerSession: sessions.length 
        ? (sessions.reduce((sum, s) => sum + (s.page_views || 0), 0) / sessions.length).toFixed(1)
        : 0,
      conversionRate: sessions.length 
        ? (((sessions.filter(s => s.spotteds_created > 0).length) / sessions.length) * 100).toFixed(1)
        : 0,
      suspiciousSessions: sessions.filter(s => s.is_suspicious).length,
      attackerSessions: sessions.filter(s => s.is_attacker).length,
      mobileUsers: sessions.filter(s => s.is_mobile).length,
      botDetected: sessions.filter(s => s.is_bot).length,
    }

    return NextResponse.json(stats)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
