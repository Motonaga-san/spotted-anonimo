import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Extrair IP real do visitante dos headers (seguro - não vem do cliente)
function extractRealIP(request: NextRequest): string {
  const headers = request.headers
  
  const cfIP = headers.get('cf-connecting-ip')
  const xRealIP = headers.get('x-real-ip')
  const xForwardedFor = headers.get('x-forwarded-for')
  const vercelIP = headers.get('x-vercel-forwarded-for')
  
  if (cfIP) return cfIP.trim()
  if (xRealIP) return xRealIP.trim()
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim()
  if (vercelIP) return vercelIP.split(',')[0].trim()
  
  return 'unknown'
}

// GET - Listar spotteds
export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  const { data, error } = await supabase
    .from('spotteds')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ spotteds: data })
}

// POST - Criar spotted
export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const body = await request.json()
  const { message, message_html, author_fingerprint } = body

  if (!message || message.length < 10) {
    return NextResponse.json({ error: 'Mensagem deve ter pelo menos 10 caracteres' }, { status: 400 })
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Mensagem deve ter no maximo 2000 caracteres' }, { status: 400 })
  }

  // Extrair IP do visitante dos headers (seguro)
  const authorIP = extractRealIP(request)

  // Formatar HTML básico se não fornecido
  const formattedHtml = message_html || message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

  const { data, error } = await supabase
    .from('spotteds')
    .insert([{
      message,
      message_html: formattedHtml,
      status: 'approved',
      likes: 0,
      author_ip: authorIP,
      author_fingerprint: author_fingerprint || null,
    }])
    .select('id, number')
    .single()

  if (error) {
    console.error('Erro ao criar spotted:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data.id, number: data.number })
}
