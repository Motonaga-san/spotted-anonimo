import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Tipos do banco de dados
export interface Spotted {
  id: string
  number: number
  message: string
  message_html?: string
  created_at: string
  status: 'approved' | 'reported' | 'hidden'
  likes: number
  views: number
  reports_count: number
  author_ip?: string
  author_fingerprint?: string
  comments?: Comment[]
}

export interface Comment {
  id: string
  spotted_id: string
  content: string
  content_html?: string
  likes: number
  status: 'approved' | 'reported' | 'hidden'
  author_ip?: string
  created_at: string
}

export interface Report {
  id: string
  spotted_id?: string
  comment_id?: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed'
  reporter_ip?: string
  created_at: string
}

export interface PageView {
  id: string
  page: string
  visitor_ip?: string
  visitor_fingerprint?: string
  user_agent?: string
  referrer?: string
  country?: string
  created_at: string
}

export interface DailyStats {
  date: string
  page_views: number
  unique_visitors: number
  spotteds_created: number
  comments_created: number
  reports_created: number
  likes_given: number
}

// Gera fingerprint do navegador
export function generateFingerprint(): string {
  if (typeof window === 'undefined') return ''
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || '',
  ]
  
  const fingerprint = components.join('|')
  return btoa(fingerprint).slice(0, 64)
}

// Registra visualização de página
export async function trackPageView(page: string): Promise<void> {
  if (!supabase) return
  
  const fingerprint = generateFingerprint()
  
  await supabase.from('page_views').insert([{
    page,
    visitor_fingerprint: fingerprint,
    user_agent: navigator.userAgent,
    referrer: document.referrer || null,
  }])
}

// Incrementa visualização do spotted
export async function incrementSpottedView(id: string): Promise<void> {
  if (!supabase) return
  
  await supabase.rpc('increment_spotted_views', { spotted_id: id })
}

// Formata texto com markdown básico (negrito, itálico)
export function formatText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
}
