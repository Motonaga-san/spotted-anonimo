import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// API para likes - usa service_role para operações seguras
// Agora verifica se o usuário já curtiu antes de incrementar
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const body = await request.json()
  const { type, id, fingerprint } = body // type: 'spotted' | 'comment', id: id do item, fingerprint: identificador do usuário

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
  }

  const table = type === 'spotted' ? 'spotteds' : 'comments'

  // Se fingerprint foi fornecido, verificar se já curtiu
  if (fingerprint) {
    const { data: existingLike } = await supabase
      .from('user_likes')
      .select('id')
      .eq('user_fingerprint', fingerprint)
      .eq('item_type', type)
      .eq('item_id', id)
      .single()

    if (existingLike) {
      // Já curtiu - retornar likes atuais sem incrementar
      const { data: item } = await supabase
        .from(table)
        .select('likes')
        .eq('id', id)
        .single()

      return NextResponse.json({ 
        success: false, 
        alreadyLiked: true, 
        likes: item?.likes || 0,
        message: 'Você já curtiu este item'
      })
    }

    // Registrar o like na tabela de likes únicos
    await supabase
      .from('user_likes')
      .insert([{
        user_fingerprint: fingerprint,
        item_type: type,
        item_id: id
      }])
  }

  // Busca o valor atual e incrementa
  const { data, error: fetchError } = await supabase
    .from(table)
    .select('likes')
    .eq('id', id)
    .single()

  if (fetchError || !data) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const newLikes = (data.likes || 0) + 1

  const { error: updateError } = await supabase
    .from(table)
    .update({ likes: newLikes })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Atualizar contador de likes na sessão do usuário (se fingerprint disponível)
  if (fingerprint) {
    await supabase
      .from('visitor_sessions')
      .update({ likes_given: supabase.rpc('increment') })
      .eq('fingerprint', fingerprint)
  }

  return NextResponse.json({ success: true, likes: newLikes, alreadyLiked: false })
}

// Verificar se usuário já curtiu
export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, anonKey)
  const { searchParams } = new URL(request.url)
  const fingerprint = searchParams.get('fingerprint')
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!fingerprint || !type || !id) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const { data } = await supabase
    .from('user_likes')
    .select('id')
    .eq('user_fingerprint', fingerprint)
    .eq('item_type', type)
    .eq('item_id', id)
    .single()

  return NextResponse.json({ hasLiked: !!data })
}
