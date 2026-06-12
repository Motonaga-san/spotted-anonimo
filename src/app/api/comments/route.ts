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
  const { spotted_id, content, content_html, author_ip, author_fingerprint } = body

  if (!spotted_id || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([{
      spotted_id,
      content,
      content_html: content_html || content,
      status: 'approved',
      author_ip: author_ip || null,
      author_fingerprint: author_fingerprint || null,
    }])
    .select('id')
    .single()

  if (error) {
    console.error('Erro ao criar comentário:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data.id })
}
