import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'get-reported') {
    // Buscar spotteds reportados
    const { data: reportedSpotteds } = await supabase
      .from('spotteds')
      .select('*')
      .eq('status', 'reported')
      .order('created_at', { ascending: false })

    // Buscar comentários reportados
    const { data: reportedComments } = await supabase
      .from('comments')
      .select('*')
      .eq('status', 'reported')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      spotteds: reportedSpotteds || [],
      comments: reportedComments || []
    })
  }

  if (action === 'get-reports') {
    // Buscar todos os reports com informações do denunciante
    const { data: reports } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    return NextResponse.json({
      reports: reports || []
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')
  const id = searchParams.get('id')

  if (!table || !id) {
    return NextResponse.json({ error: 'Missing table or id' }, { status: 400 })
  }

  // Se for comentário, primeiro excluir os reports associados
  if (table === 'comments') {
    await supabase
      .from('reports')
      .delete()
      .eq('comment_id', id)
  }

  // Se for spotted, primeiro excluir comentários e reports associados
  if (table === 'spotteds') {
    await supabase
      .from('comments')
      .delete()
      .eq('spotted_id', id)
    
    await supabase
      .from('reports')
      .delete()
      .eq('spotted_id', id)
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const body = await request.json()
  const { table, id, spotted_id, comment_id, data } = body

  if (!table || !data) {
    return NextResponse.json({ error: 'Missing table or data' }, { status: 400 })
  }

  let query = supabase.from(table).update(data)
  
  if (id) {
    query = query.eq('id', id)
  } else if (spotted_id) {
    query = query.eq('spotted_id', spotted_id)
  } else if (comment_id) {
    query = query.eq('comment_id', comment_id)
  } else {
    return NextResponse.json({ error: 'Missing id, spotted_id or comment_id' }, { status: 400 })
  }

  const { error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const body = await request.json()
  const { action } = body

  if (action === 'reset-counter') {
    // Deletar todos os spotteds
    const { error: deleteSpottedsError } = await supabase
      .from('spotteds')
      .delete()
      .not('id', 'is', null)

    if (deleteSpottedsError) {
      return NextResponse.json({ error: deleteSpottedsError.message }, { status: 500 })
    }

    // Deletar todos os comentários
    await supabase
      .from('comments')
      .delete()
      .not('id', 'is', null)

    // Deletar todos os reports
    await supabase
      .from('reports')
      .delete()
      .not('id', 'is', null)

    // Tentar resetar a sequência via RPC (se existir)
    try {
      await supabase.rpc('reset_spotteds_sequence')
    } catch {
      // RPC pode não existir - ignorar
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Todos os spotteds foram excluídos! Para resetar o contador, execute no SQL Editor: ALTER SEQUENCE spotteds_number_seq RESTART WITH 1;'
    })
  }

  if (action === 'reset-all') {
    // Deletar todos os spotteds
    await supabase.from('spotteds').delete().not('id', 'is', null)
    
    // Deletar todos os comentários
    await supabase.from('comments').delete().not('id', 'is', null)
    
    // Deletar todos os reports
    await supabase.from('reports').delete().not('id', 'is', null)
    
    // Deletar todos os user_likes
    await supabase.from('user_likes').delete().not('id', 'is', null)
    
    // Deletar todos os security_events
    await supabase.from('security_events').delete().not('id', 'is', null)
    
    // Deletar todos os visitor_sessions
    await supabase.from('visitor_sessions').delete().not('id', 'is', null)
    
    // Deletar todos os daily_stats
    await supabase.from('daily_stats').delete().not('date', 'is', null)
    
    // Deletar todos os page_views
    await supabase.from('page_views').delete().not('id', 'is', null)

    // Tentar resetar sequência via RPC
    try {
      await supabase.rpc('reset_sequence', { sequence_name: 'spotteds_number_seq', restart_value: 1 })
    } catch {
      // Função RPC pode não existir - ignorar
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Todos os dados foram excluídos! Execute no Supabase SQL: ALTER SEQUENCE spotteds_number_seq RESTART WITH 1;'
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
