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
    const { error } = await supabase
      .from('analytics_events')
      .insert([event])

    if (error) {
      console.error('Erro ao registrar evento:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'update-session' && sessionId && data) {
    // Upsert da sessão
    const { error } = await supabase
      .from('user_sessions')
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

    // Buscar estatísticas em paralelo
    const [eventsResult, sessionsResult, spottedsResult, commentsResult] = await Promise.all([
      supabase.from('analytics_events').select('*').gte('created_at', startDate),
      supabase.from('user_sessions').select('*').gte('started_at', startDate),
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
      uniqueVisitors: new Set(sessions.map(s => s.visitor_fingerprint).filter(Boolean)).size,
      eventsByType: events.reduce((acc: Record<string, number>, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1
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
    }

    return NextResponse.json(stats)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
