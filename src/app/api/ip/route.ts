import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Captura o IP real do cliente
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
  
  const ip = cfConnectingIp || forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
  
  const userAgent = request.headers.get('user-agent') || ''
  const country = request.headers.get('x-vercel-ip-country') || ''
  const city = request.headers.get('x-vercel-ip-city') || ''
  
  return NextResponse.json({
    ip,
    userAgent,
    country,
    city,
  })
}
