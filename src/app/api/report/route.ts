import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const body = await request.json()
  const { type, id, spottedId, reason, reporterIp, reporterFingerprint } = body

  if (!type || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 1. Inserir a denúncia (apenas campos que existem no schema atual)
  const reportData: Record<string, unknown> = {
    reason,
    status: 'pending',
  }

  if (type === 'spotted') {
    reportData.spotted_id = id
  } else if (type === 'comment') {
    reportData.spotted_id = spottedId
    reportData.comment_id = id
  }

  const { error: reportError } = await supabase
    .from('reports')
    .insert([reportData])

  if (reportError) {
    console.error('Erro ao criar denúncia:', reportError)
    return NextResponse.json({ error: reportError.message }, { status: 500 })
  }

  // 2. Atualizar status do item para 'reported' (some da visualização pública)
  const table = type === 'spotted' ? 'spotteds' : 'comments'
  
  const { error: updateError } = await supabase
    .from(table)
    .update({ status: 'reported' })
    .eq('id', id)

  if (updateError) {
    console.error('Erro ao atualizar status:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
