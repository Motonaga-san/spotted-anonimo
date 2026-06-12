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
  const { table, id, spotted_id, data } = body

  if (!table || !data) {
    return NextResponse.json({ error: 'Missing table or data' }, { status: 400 })
  }

  let query = supabase.from(table).update(data)
  
  if (id) {
    query = query.eq('id', id)
  } else if (spotted_id) {
    query = query.eq('spotted_id', spotted_id)
  } else {
    return NextResponse.json({ error: 'Missing id or spotted_id' }, { status: 400 })
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

    // Resetar a sequência via SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/reset_spotteds_counter`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Todos os spotteds foram excluídos! Para resetar o contador, execute este SQL no Supabase SQL Editor: ALTER SEQUENCE spotteds_number_seq RESTART WITH 1;'
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
