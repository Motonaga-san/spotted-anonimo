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
  const { type, id, reason } = body

  if (!type || !id || !reason) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Atualizar status do item para 'reported' (some da visualização pública)
  const table = type === 'spotted' ? 'spotteds' : 'comments'
  
  const { error: updateError } = await supabase
    .from(table)
    .update({ status: 'reported' })
    .eq('id', id)

  if (updateError) {
    console.error('Erro ao atualizar status:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log da denúncia para o admin ver (em produção, usar sistema de logs adequado)
  console.log(`[REPORT] ${type} ${id} reported for: ${reason}`)

  return NextResponse.json({ success: true })
}
