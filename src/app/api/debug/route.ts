import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  const envStatus = {
    hasSupabaseUrl: !!supabaseUrl,
    supabaseUrlLength: supabaseUrl.length,
    supabaseUrlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET',
    supabaseUrlFull: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    anonKeyLength: supabaseAnonKey.length,
    anonKeyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET',
    hasServiceKey: !!serviceRoleKey,
    serviceKeyLength: serviceRoleKey.length,
  }
  
  // Test connection with anon key
  let connectionTest = null
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase.from('spotteds').select('id').limit(1)
      connectionTest = {
        success: !error,
        error: error?.message || null,
        errorFull: error ? JSON.stringify(error) : null,
        dataReceived: !!data
      }
    } catch (e) {
      connectionTest = {
        success: false,
        error: (e as Error).message,
        dataReceived: false
      }
    }
  }
  
  // Test insert with anon key
  let insertTest = null
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data, error } = await supabase
        .from('spotteds')
        .insert([{ 
          message: 'Teste de debug - ignore', 
          status: 'approved',
          likes: 0 
        }])
        .select('id')
        .single()
      
      insertTest = {
        success: !error,
        error: error?.message || null,
        errorDetails: error ? JSON.stringify(error, null, 2) : null,
        insertedId: data?.id || null
      }
    } catch (e) {
      insertTest = {
        success: false,
        error: (e as Error).message,
        errorDetails: null,
        insertedId: null
      }
    }
  }
  
  return NextResponse.json({
    env: envStatus,
    connection: connectionTest,
    insert: insertTest,
    timestamp: new Date().toISOString(),
    note: 'Server-side debug - NEXT_PUBLIC vars should be available at build time for client'
  })
}
