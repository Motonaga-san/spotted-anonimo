import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// API para likes - usa service_role para operações seguras
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const body = await request.json()
  const { type, id } = body // type: 'spotted' | 'comment', id: id do item

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
  }

  const table = type === 'spotted' ? 'spotteds' : 'comments'

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

  return NextResponse.json({ success: true, likes: newLikes })
}
