import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  
  // Senha definida em variável de ambiente server-side (não exposta ao cliente)
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  if (password === adminPassword) {
    // Retorna um token simples (hash da senha + timestamp) para sessão
    const token = Buffer.from(`${password}:${Date.now()}`).toString('base64')
    return NextResponse.json({ success: true, token })
  }
  
  return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 })
}

export async function GET(request: NextRequest) {
  // Verifica se o token é válido
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  
  const token = authHeader.replace('Bearer ', '')
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const [password] = decoded.split(':')
    
    if (password === adminPassword) {
      return NextResponse.json({ authenticated: true })
    }
  } catch {
    // Token inválido
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 })
}
