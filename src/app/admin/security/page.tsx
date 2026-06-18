'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

interface VisitorSession {
  session_id: string
  ip_address: string
  fingerprint: string
  user_agent: string
  os_type: string
  os_version: string
  browser: string
  device_brand: string
  device_model: string
  country: string
  city: string
  risk_score: number
  is_suspicious: boolean
  is_attacker: boolean
  spotteds_created: number
  comments_created: number
  started_at: string
  last_activity: string
}

interface SecurityEvent {
  id: string
  event_type: string
  severity: string
  ip_address: string
  session_id: string
  action: string
  content_preview: string
  created_at: string
  visitor_fingerprint?: string
  page?: string
  country?: string
}

interface NetworkDevice {
  ip_address: string
  mac_address: string
  vendor: string
  device_type: string
  is_suspicious: boolean
  ssid: string
  last_seen: string
}

interface UniqueDevice {
  fingerprint: string
  ip_address: string
  os_type: string
  os_version: string
  browser: string
  browser_version: string
  device_brand: string
  device_model: string
  is_mobile: boolean
  is_tablet: boolean
  country: string
  city: string
  visit_count: number
  spotteds_created: number
  first_seen: string
  last_seen: string
  risk_score: number
  is_attacker: boolean
}

// Network Monitor Interfaces
interface LocalNetworkDevice {
  ip: string
  mac?: string
  hostname?: string
  vendor?: string
  device_type?: string
  os_guess?: string
  first_seen: string
  last_seen: string
  is_active: boolean
  times_seen: number
  open_ports?: number[]
  services?: string[]
}

interface NetworkVisitor {
  session_id: string
  public_ip: string
  local_ip?: string
  webrtc_ip?: string
  fingerprint: string
  canvas_hash?: string
  webgl_hash?: string
  audio_hash?: string
  font_list?: string[]
  screen_resolution?: string
  timezone?: string
  language?: string
  cpu_cores?: number
  memory?: number
  battery_level?: number
  connection_type?: string
  os_type: string
  browser: string
  device_brand?: string
  device_model?: string
  user_agent: string
  is_same_network: boolean
  subnet_match?: string
  first_seen: string
  last_seen: string
  visit_count: number
  spotteds_created: number
  comments_created: number
  risk_score: number
  is_suspicious: boolean
}

interface NetworkStats {
  total_local_visitors: number
  unique_local_ips: number
  apple_devices: number
  android_devices: number
  windows_devices: number
  active_now: number
  same_network_visits: number
  avg_visits_per_device: number
  top_visitor: NetworkVisitor | null
  recent_visitors: NetworkVisitor[]
}

interface SubnetInfo {
  cidr: string
  network: string
  broadcast: string
  mask: string
  first_ip: string
  last_ip: string
  total_hosts: number
  detected_subnet: string
  gateway?: string
}

type SortByType = 'visits' | 'spotteds' | 'recent' | 'risk'

export default function SecurityDashboard() {
  const [sessions, setSessions] = useState<VisitorSession[]>([])
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [devices, setDevices] = useState<NetworkDevice[]>([])
  const [uniqueDevices, setUniqueDevices] = useState<UniqueDevice[]>([])
  const [sortBy, setSortBy] = useState<SortByType>('visits')
  const [stats, setStats] = useState({
    totalSessions: 0,
    attackers: 0,
    suspicious: 0,
    appleDevices: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sessions' | 'events' | 'devices' | 'network' | 'correlation'>('sessions')
  const [networkVisitors, setNetworkVisitors] = useState<NetworkVisitor[]>([])
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null)
  const [subnetInfo, setSubnetInfo] = useState<SubnetInfo | null>(null)
  const [networkLoading, setNetworkLoading] = useState(false)
  const [localNetworkDevices, setLocalNetworkDevices] = useState<LocalNetworkDevice[]>([])
  const [detectedSubnet, setDetectedSubnet] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Atualiza a cada 30s
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // Buscar sessões suspeitas/atacantes
      const { data: sessionsData } = await supabase
        .from('visitor_sessions')
        .select('*')
        .or('is_suspicious.eq.true,is_attacker.eq.true,risk_score.gte.40')
        .order('last_activity', { ascending: false })
        .limit(50)
      
      if (sessionsData) setSessions(sessionsData as VisitorSession[])

      // Buscar eventos de segurança (agora inclui analytics)
      const { data: securityEventsData } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      // Formatar eventos
      const allEvents: SecurityEvent[] = []
      
      if (securityEventsData) {
        securityEventsData.forEach((e: Record<string, unknown>) => {
          const details = e.details as Record<string, unknown> || {}
          allEvents.push({
            id: e.id as string,
            event_type: e.event_type as string,
            severity: (e.severity as string) || 'info',
            ip_address: e.ip_address as string || details.visitor_ip as string || '',
            session_id: e.session_id as string || '',
            action: e.action as string,
            content_preview: e.content_preview as string || '',
            created_at: e.created_at as string,
            visitor_fingerprint: e.fingerprint as string || details.visitor_fingerprint as string || '',
            page: e.action as string,
            country: details.country as string || ''
          })
        })
      }
      
      setEvents(allEvents)

      // Buscar dispositivos de rede
      const { data: devicesData } = await supabase
        .from('network_devices')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(100)
      
      if (devicesData) setDevices(devicesData as NetworkDevice[])

      // Buscar todas as sessões para agregar dispositivos únicos
      const { data: allSessions } = await supabase
        .from('visitor_sessions')
        .select('*')
        .order('last_activity', { ascending: false })
        .limit(200)

      // Agregar dispositivos únicos por fingerprint
      const deviceMap = new Map<string, UniqueDevice>()
      if (allSessions) {
        allSessions.forEach((s: Record<string, unknown>) => {
          const fp = (s.fingerprint as string) || (s.session_id as string)
          if (!fp) return
          
          if (deviceMap.has(fp)) {
            const existing = deviceMap.get(fp)!
            existing.visit_count += 1
            existing.spotteds_created += (s.spotteds_created as number) || 0
            if (s.last_activity as string > existing.last_seen) {
              existing.last_seen = s.last_activity as string
            }
            if (s.risk_score as number > existing.risk_score) {
              existing.risk_score = s.risk_score as number
            }
            if (s.is_attacker as boolean) {
              existing.is_attacker = true
            }
          } else {
            deviceMap.set(fp, {
              fingerprint: fp,
              ip_address: s.ip_address as string || '',
              os_type: s.os_type as string || 'Unknown',
              os_version: s.os_version as string || '',
              browser: s.browser as string || 'Unknown',
              browser_version: s.browser_version as string || '',
              device_brand: s.device_brand as string || '',
              device_model: s.device_model as string || '',
              is_mobile: s.is_mobile as boolean || false,
              is_tablet: s.is_tablet as boolean || false,
              country: s.country as string || '',
              city: s.city as string || '',
              visit_count: 1,
              spotteds_created: (s.spotteds_created as number) || 0,
              first_seen: s.started_at as string || '',
              last_seen: s.last_activity as string || '',
              risk_score: (s.risk_score as number) || 0,
              is_attacker: (s.is_attacker as boolean) || false
            })
          }
        })
      }

      // Ordenar por visitas
      const sortedDevices = Array.from(deviceMap.values()).sort((a, b) => b.visit_count - a.visit_count)
      setUniqueDevices(sortedDevices)

      // Calcular estatísticas
      const totalSessions = sessionsData?.length || 0
      const attackers = sessionsData?.filter(s => s.is_attacker).length || 0
      const suspicious = sessionsData?.filter(s => s.is_suspicious).length || 0
      const appleDevices = sortedDevices.filter(d => d.device_brand === 'Apple' || d.os_type === 'macOS' || d.os_type === 'iOS').length
      
      setStats({ totalSessions, attackers, suspicious, appleDevices })
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  async function markAsAttacker(sessionId: string, isAttacker: boolean) {
    await supabase
      .from('visitor_sessions')
      .update({ 
        is_attacker: isAttacker,
        risk_score: isAttacker ? 100 : 0
      })
      .eq('session_id', sessionId)
    
    fetchData()
  }

  async function blockIP(ip: string) {
    await supabase
      .from('blocked_entities')
      .insert([{
        entity_type: 'ip',
        entity_value: ip,
        reason: 'Blocked via security dashboard',
        is_active: true,
        is_permanent: true
      }])
    
    fetchData()
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-500'
    if (score >= 50) return 'bg-orange-500'
    if (score >= 30) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Ordenar dispositivos únicos
  const getSortedDevices = () => {
    const sorted = [...uniqueDevices]
    switch (sortBy) {
      case 'visits':
        return sorted.sort((a, b) => b.visit_count - a.visit_count)
      case 'spotteds':
        return sorted.sort((a, b) => b.spotteds_created - a.spotteds_created)
      case 'recent':
        return sorted.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
      case 'risk':
        return sorted.sort((a, b) => b.risk_score - a.risk_score)
      default:
        return sorted
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'danger': return 'text-orange-600 bg-orange-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  // === NETWORK MONITORING FUNCTIONS ===
  
  // Detectar subnet local via WebRTC
  async function detectLocalNetwork(): Promise<string | null> {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] })
      pc.createDataChannel('')
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pc.close()
          resolve(null)
        }, 3000)
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate
            // Extrair IP local do candidate
            const ipMatch = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
            if (ipMatch) {
              const ip = ipMatch[1]
              // Verificar se é IP privado (10.x, 172.16-31.x, 192.168.x)
              if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
                clearTimeout(timeout)
                pc.close()
                resolve(ip)
              }
            }
          }
        }
      })
    } catch {
      return null
    }
  }

  // Calcular subnet a partir de um IP
  function calculateSubnet(ip: string, maskBits: number = 24): SubnetInfo {
    const parts = ip.split('.').map(Number)
    const mask = [0, 0, 0, 0]
    for (let i = 0; i < maskBits; i++) {
      mask[Math.floor(i / 8)] |= (128 >> (i % 8))
    }
    
    const network = parts.map((p, i) => p & mask[i])
    const broadcast = network.map((n, i) => n | (255 - mask[i]))
    
    return {
      cidr: `${network.join('.')}/${maskBits}`,
      network: network.join('.'),
      broadcast: broadcast.join('.'),
      mask: mask.join('.'),
      first_ip: `${network[0]}.${network[1]}.${network[2]}.${(network[3] + 1)}`,
      last_ip: `${broadcast[0]}.${broadcast[1]}.${broadcast[2]}.${(broadcast[3] - 1)}`,
      total_hosts: Math.pow(2, 32 - maskBits) - 2,
      detected_subnet: `${network[0]}.${network[1]}.${network[2]}.0/${maskBits}`
    }
  }

  // Verificar se um IP está na mesma subnet
  function isSameSubnet(ip1: string, ip2: string, maskBits: number = 24): boolean {
    const mask = (0xFFFFFFFF << (32 - maskBits)) >>> 0
    const toInt = (ip: string) => ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0
    return (toInt(ip1) & mask) === (toInt(ip2) & mask)
  }

  // Fetch network visitors
  async function fetchNetworkData() {
    setNetworkLoading(true)
    try {
      // Detectar subnet local
      const localIP = await detectLocalNetwork()
      if (localIP) {
        setDetectedSubnet(localIP)
        setSubnetInfo(calculateSubnet(localIP, 24))
      }

      // Buscar todos os visitantes
      const { data: allSessions } = await supabase
        .from('visitor_sessions')
        .select('*')
        .order('last_activity', { ascending: false })
        .limit(500)

      if (!allSessions) {
        setNetworkLoading(false)
        return
      }

      // Processar e identificar visitantes da mesma rede
      const networkVisitorsData: NetworkVisitor[] = []
      const publicIPs = new Map<string, number>()
      
      // Primeiro, agrupar por IP público
      allSessions.forEach((s: Record<string, unknown>) => {
        const publicIP = s.ip_address as string
        if (publicIP) {
          publicIPs.set(publicIP, (publicIPs.get(publicIP) || 0) + 1)
        }
      })

      // Encontrar o IP mais frequente (provavelmente o IP do prédio)
      let mostCommonIP = ''
      let maxCount = 0
      publicIPs.forEach((count, ip) => {
        if (count > maxCount) {
          maxCount = count
          mostCommonIP = ip
        }
      })

      // Processar sessões
      allSessions.forEach((s: Record<string, unknown>) => {
        const publicIP = s.ip_address as string
        const isSameNetwork = publicIP === mostCommonIP
        
        networkVisitorsData.push({
          session_id: s.session_id as string || '',
          public_ip: publicIP || '',
          local_ip: s.local_ip as string || undefined,
          webrtc_ip: s.webrtc_ip as string || undefined,
          fingerprint: s.fingerprint as string || '',
          canvas_hash: s.canvas_hash as string || undefined,
          webgl_hash: s.webgl_hash as string || undefined,
          audio_hash: s.audio_hash as string || undefined,
          font_list: s.font_list as string[] || undefined,
          screen_resolution: s.screen_resolution as string || undefined,
          timezone: s.timezone as string || undefined,
          language: s.language as string || undefined,
          cpu_cores: s.cpu_cores as number || undefined,
          memory: s.memory as number || undefined,
          battery_level: s.battery_level as number || undefined,
          connection_type: s.connection_type as string || undefined,
          os_type: s.os_type as string || 'Unknown',
          browser: s.browser as string || 'Unknown',
          device_brand: s.device_brand as string || undefined,
          device_model: s.device_model as string || undefined,
          user_agent: s.user_agent as string || '',
          is_same_network: isSameNetwork,
          subnet_match: isSameNetwork ? mostCommonIP : undefined,
          first_seen: s.started_at as string || '',
          last_seen: s.last_activity as string || '',
          visit_count: 1,
          spotteds_created: (s.spotteds_created as number) || 0,
          comments_created: (s.comments_created as number) || 0,
          risk_score: (s.risk_score as number) || 0,
          is_suspicious: (s.is_suspicious as boolean) || false
        })
      })

      setNetworkVisitors(networkVisitorsData)

      // Calcular estatísticas
      const sameNetworkVisitors = networkVisitorsData.filter(v => v.is_same_network)
      const uniqueLocalIPs = new Set(sameNetworkVisitors.map(v => v.fingerprint))
      
      const statsData: NetworkStats = {
        total_local_visitors: sameNetworkVisitors.length,
        unique_local_ips: uniqueLocalIPs.size,
        apple_devices: sameNetworkVisitors.filter(v => 
          v.os_type === 'macOS' || v.os_type === 'iOS' || v.device_brand === 'Apple'
        ).length,
        android_devices: sameNetworkVisitors.filter(v => v.os_type === 'Android').length,
        windows_devices: sameNetworkVisitors.filter(v => v.os_type === 'Windows').length,
        active_now: sameNetworkVisitors.filter(v => {
          const lastSeen = new Date(v.last_seen)
          const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
          return lastSeen > fiveMinAgo
        }).length,
        same_network_visits: sameNetworkVisitors.reduce((acc, v) => acc + v.visit_count, 0),
        avg_visits_per_device: sameNetworkVisitors.length > 0 
          ? sameNetworkVisitors.reduce((acc, v) => acc + v.visit_count, 0) / sameNetworkVisitors.length 
          : 0,
        top_visitor: sameNetworkVisitors.sort((a, b) => b.spotteds_created - a.spotteds_created)[0] || null,
        recent_visitors: sameNetworkVisitors.slice(0, 5)
      }
      
      setNetworkStats(statsData)

      // Agrupar por fingerprint para criar dispositivos locais
      const deviceMap = new Map<string, LocalNetworkDevice>()
      sameNetworkVisitors.forEach(v => {
        if (!v.fingerprint) return
        if (deviceMap.has(v.fingerprint)) {
          const existing = deviceMap.get(v.fingerprint)!
          existing.times_seen += 1
          existing.last_seen = v.last_seen > existing.last_seen ? v.last_seen : existing.last_seen
          existing.is_active = new Date(v.last_seen) > new Date(Date.now() - 10 * 60 * 1000)
        } else {
          deviceMap.set(v.fingerprint, {
            ip: v.public_ip,
            mac: undefined, // Não disponível via web
            hostname: undefined,
            vendor: v.device_brand || 'Unknown',
            device_type: v.os_type?.includes('iOS') || v.os_type?.includes('Android') ? 'Mobile' : 'Desktop',
            os_guess: v.os_type,
            first_seen: v.first_seen,
            last_seen: v.last_seen,
            is_active: new Date(v.last_seen) > new Date(Date.now() - 10 * 60 * 1000),
            times_seen: 1
          })
        }
      })
      
      setLocalNetworkDevices(Array.from(deviceMap.values()))
      
    } catch (error) {
      console.error('Error fetching network data:', error)
    }
    setNetworkLoading(false)
  }

  // Fetch network data when tab changes
  useEffect(() => {
    if (activeTab === 'network') {
      fetchNetworkData()
    }
  }, [activeTab])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Dashboard</h1>
          <p className="text-gray-400">Monitoramento de ameaças - Spotted</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Sessions</div>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </div>
          <div className="bg-red-900/50 rounded-lg p-4 border border-red-700">
            <div className="text-red-400 text-sm">Known Attackers</div>
            <div className="text-2xl font-bold text-red-500">{stats.attackers}</div>
          </div>
          <div className="bg-orange-900/50 rounded-lg p-4 border border-orange-700">
            <div className="text-orange-400 text-sm">Suspicious</div>
            <div className="text-2xl font-bold text-orange-500">{stats.suspicious}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Apple Devices</div>
            <div className="text-2xl font-bold">{stats.appleDevices}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['sessions', 'events', 'devices', 'network', 'correlation'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab 
                  ? tab === 'network' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab === 'network' ? 'Network Monitor' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Sessions Tab - Ranking de Visitantes */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                {/* Controles de ordenacao */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-400 text-sm">Ordenar por:</span>
                    <button
                      onClick={() => setSortBy('visits')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        sortBy === 'visits' ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Visitas
                    </button>
                    <button
                      onClick={() => setSortBy('spotteds')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        sortBy === 'spotteds' ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Spotteds
                    </button>
                    <button
                      onClick={() => setSortBy('recent')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        sortBy === 'recent' ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Recentes
                    </button>
                    <button
                      onClick={() => setSortBy('risk')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        sortBy === 'risk' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Risco
                    </button>
                    <span className="ml-auto text-gray-400 text-sm">
                      {uniqueDevices.length} visitantes unicos
                    </span>
                  </div>
                </div>

                {/* Tabela de ranking */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs">#</th>
                        <th className="px-4 py-3 text-left">Visitante</th>
                        <th className="px-4 py-3 text-left">Device</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-center">Visitas</th>
                        <th className="px-4 py-3 text-center">Posts</th>
                        <th className="px-4 py-3 text-center">Risk</th>
                        <th className="px-4 py-3 text-left">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {getSortedDevices().length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            Nenhum visitante registrado ainda.
                          </td>
                        </tr>
                      ) : (
                        getSortedDevices().map((device, index) => (
                          <tr 
                            key={device.fingerprint} 
                            className={`hover:bg-gray-700/50 ${
                              device.is_attacker 
                                ? 'bg-red-900/20' 
                                : index < 3 
                                  ? 'bg-pink-900/10' 
                                  : ''
                            }`}
                          >
                            <td className="px-3 py-3">
                              {index < 3 ? (
                                <span className={`text-lg ${
                                  index === 0 ? 'text-yellow-400' : 
                                  index === 1 ? 'text-gray-300' : 
                                  'text-orange-400'
                                }`}>
                                  {index === 0 ? '1' : index === 1 ? '2' : '3'}
                                </span>
                              ) : (
                                <span className="text-gray-500 text-sm">{index + 1}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono text-sm truncate max-w-[120px]" title={device.fingerprint}>
                                {device.fingerprint?.slice(0, 10)}...
                              </div>
                              <div className="text-xs text-gray-500">
                                {device.ip_address || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {device.os_type === 'Windows' && <span>Win</span>}
                                {device.os_type === 'macOS' && <span>Mac</span>}
                                {device.os_type === 'iOS' && <span>iOS</span>}
                                {device.os_type === 'Android' && <span>And</span>}
                                {device.os_type === 'Linux' && <span>Lin</span>}
                                {!['Windows', 'macOS', 'iOS', 'Android', 'Linux'].includes(device.os_type) && <span>?</span>}
                                <div>
                                  <div className="text-sm">{device.os_type || 'Unknown'}</div>
                                  <div className="text-xs text-gray-500">{device.browser || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">{device.country || '-'}</div>
                              <div className="text-xs text-gray-500">{device.city || '-'}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-1 bg-blue-600/50 rounded text-sm font-medium">
                                {device.visit_count}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                device.spotteds_created > 0 ? 'bg-pink-600' : 'bg-gray-700'
                              }`}>
                                {device.spotteds_created}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className={`w-10 h-2 rounded ${getRiskColor(device.risk_score)}`}></div>
                                <span className="text-xs">{device.risk_score}</span>
                                {device.is_attacker && (
                                  <span className="text-xs bg-red-600 px-1.5 py-0.5 rounded">ATK</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                {device.last_seen ? new Date(device.last_seen).toLocaleDateString() : '-'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : ''}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-700 text-sm text-gray-300">
                  Mostrando {events.length} eventos de analytics e segurança
                </div>
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">IP</th>
                      <th className="px-4 py-3 text-left">Fingerprint</th>
                      <th className="px-4 py-3 text-left">Country</th>
                      <th className="px-4 py-3 text-left">Page/Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Nenhum evento registrado ainda. Acesse o site para gerar eventos.
                        </td>
                      </tr>
                    ) : (
                      events.map(event => (
                        <tr key={event.id} className="hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm">
                            {new Date(event.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              event.event_type === 'page_view' ? 'bg-blue-600' :
                              event.event_type === 'click' ? 'bg-green-600' :
                              event.event_type === 'spotteds_viewed' ? 'bg-purple-600' :
                              event.event_type === 'spotted_created' ? 'bg-pink-600' :
                              'bg-gray-600'
                            }`}>
                              {event.event_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm">
                            {event.ip_address || '-'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">
                            {event.visitor_fingerprint ? event.visitor_fingerprint.slice(0, 16) + '...' : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {event.country || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-xs">
                            {event.page || event.action || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === 'devices' && (
              <div className="space-y-4">
                {/* Stats de dispositivos */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Dispositivos Únicos</div>
                    <div className="text-2xl font-bold">{uniqueDevices.length}</div>
                  </div>
                  <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700">
                    <div className="text-blue-400 text-sm">Apple Devices</div>
                    <div className="text-2xl font-bold text-blue-500">{stats.appleDevices}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Mobile</div>
                    <div className="text-2xl font-bold">{uniqueDevices.filter(d => d.is_mobile).length}</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Desktop</div>
                    <div className="text-2xl font-bold">{uniqueDevices.filter(d => !d.is_mobile && !d.is_tablet).length}</div>
                  </div>
                </div>

                {/* Tabela de dispositivos */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left">Device</th>
                        <th className="px-4 py-3 text-left">OS / Browser</th>
                        <th className="px-4 py-3 text-left">IP</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-left">Visits</th>
                        <th className="px-4 py-3 text-left">Posts</th>
                        <th className="px-4 py-3 text-left">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {uniqueDevices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            Nenhum dispositivo registrado ainda. Acesse o site para gerar dados.
                          </td>
                        </tr>
                      ) : (
                        uniqueDevices.map((device) => (
                          <tr key={device.fingerprint} className={`hover:bg-gray-700/50 ${
                            device.device_brand === 'Apple' || device.os_type === 'macOS' || device.os_type === 'iOS' 
                              ? 'bg-blue-900/10' 
                              : device.is_attacker 
                                ? 'bg-red-900/20' 
                                : ''
                          }`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {device.is_mobile ? (
                                  <span className="text-xl">📱</span>
                                ) : device.is_tablet ? (
                                  <span className="text-xl">📱</span>
                                ) : (
                                  <span className="text-xl">💻</span>
                                )}
                                <div>
                                  <div className="font-medium">
                                    {device.device_brand || device.os_type || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {device.device_model || '-'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {device.os_type === 'Windows' && <span className="text-blue-400">🪟</span>}
                                {device.os_type === 'macOS' && <span>🍎</span>}
                                {device.os_type === 'iOS' && <span>📱</span>}
                                {device.os_type === 'Android' && <span className="text-green-400">🤖</span>}
                                {device.os_type === 'Linux' && <span>🐧</span>}
                                {!['Windows', 'macOS', 'iOS', 'Android', 'Linux'].includes(device.os_type) && <span>❓</span>}
                                <div>
                                  <div className="text-sm">
                                    {device.os_type} {device.os_version}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {device.browser} {device.browser_version}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono text-sm">{device.ip_address || '-'}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[120px]">
                                {device.fingerprint?.slice(0, 12)}...
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">{device.country || '-'}</div>
                              <div className="text-xs text-gray-500">{device.city || '-'}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-gray-700 rounded text-sm">
                                {device.visit_count}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                device.spotteds_created > 0 ? 'bg-pink-600' : 'bg-gray-700'
                              }`}>
                                {device.spotteds_created}
                              </span>
                              {device.is_attacker && (
                                <span className="ml-2 px-2 py-1 bg-red-600 rounded text-xs">ATTACKER</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {device.last_seen ? new Date(device.last_seen).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Network Monitor Tab */}
            {activeTab === 'network' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-purple-400">Network Monitor</h2>
                    <p className="text-gray-400 text-sm mt-1">Monitoramento de visitantes da mesma rede local</p>
                  </div>
                  <button
                    onClick={fetchNetworkData}
                    disabled={networkLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {networkLoading ? 'Escaneando...' : 'Escanear Rede'}
                  </button>
                </div>

                {/* Subnet Info Card */}
                {subnetInfo && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
                    <h3 className="text-lg font-semibold text-purple-300 mb-3">Subnet Detectada</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Network:</span>
                        <div className="font-mono text-white">{subnetInfo.network}.0/24</div>
                      </div>
                      <div>
                        <span className="text-gray-500">IP Range:</span>
                        <div className="font-mono text-white">{subnetInfo.first_ip} - {subnetInfo.last_ip.split('.').pop()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Hosts:</span>
                        <div className="font-mono text-white">{subnetInfo.total_hosts}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Seu IP Local:</span>
                        <div className="font-mono text-green-400">{detectedSubnet || 'Detectando...'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/20">
                    <div className="text-3xl font-bold text-purple-400">{networkStats?.total_local_visitors || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">Visitantes da Rede</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-blue-500/20">
                    <div className="text-3xl font-bold text-blue-400">{networkStats?.unique_local_ips || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">Dispositivos Unicos</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-500/20">
                    <div className="text-3xl font-bold text-white">{networkStats?.apple_devices || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">Apple</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-green-500/20">
                    <div className="text-3xl font-bold text-green-400">{networkStats?.android_devices || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">Android</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-cyan-500/20">
                    <div className="text-3xl font-bold text-cyan-400">{networkStats?.windows_devices || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">Windows</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-yellow-500/20">
                    <div className="text-3xl font-bold text-yellow-400">{networkStats?.active_now || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">Ativos Agora</div>
                  </div>
                </div>

                {/* Recent Local Visitors */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold">Visitantes da Mesma Rede</h3>
                    <span className="text-xs text-gray-400">
                      {networkVisitors.filter(v => v.is_same_network).length} dispositivos detectados
                    </span>
                  </div>
                  
                  {networkLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                      <p className="mt-2 text-gray-400 text-sm">Escaneando rede...</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs">Status</th>
                          <th className="px-3 py-2 text-left text-xs">Device</th>
                          <th className="px-3 py-2 text-left text-xs">Browser</th>
                          <th className="px-3 py-2 text-left text-xs">Fingerprint</th>
                          <th className="px-3 py-2 text-center text-xs">Posts</th>
                          <th className="px-3 py-2 text-center text-xs">Risk</th>
                          <th className="px-3 py-2 text-left text-xs">Last Seen</th>
                          <th className="px-3 py-2 text-left text-xs">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {networkVisitors.filter(v => v.is_same_network).slice(0, 50).map((visitor, idx) => {
                          const isActive = new Date(visitor.last_seen) > new Date(Date.now() - 5 * 60 * 1000)
                          return (
                            <tr key={visitor.session_id || idx} className={`hover:bg-gray-700/50 ${visitor.is_suspicious ? 'bg-red-900/20' : ''}`}>
                              <td className="px-3 py-2">
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1">
                                  {visitor.os_type === 'iOS' && <span className="text-xs">iOS</span>}
                                  {visitor.os_type === 'macOS' && <span className="text-xs">Mac</span>}
                                  {visitor.os_type === 'Android' && <span className="text-xs">And</span>}
                                  {visitor.os_type === 'Windows' && <span className="text-xs">Win</span>}
                                  {visitor.os_type === 'Linux' && <span className="text-xs">Lin</span>}
                                  {!['iOS', 'macOS', 'Android', 'Windows', 'Linux'].includes(visitor.os_type) && <span className="text-xs">?</span>}
                                </div>
                                <div className="text-xs text-gray-500">{visitor.device_brand || '-'}</div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-xs truncate max-w-[80px]">{visitor.browser}</div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-mono text-xs text-gray-400 truncate max-w-[100px]" title={visitor.fingerprint}>
                                  {visitor.fingerprint?.slice(0, 8)}...
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-xs ${visitor.spotteds_created > 0 ? 'bg-pink-600' : 'bg-gray-700'}`}>
                                  {visitor.spotteds_created}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <div className={`w-8 h-1.5 rounded ${getRiskColor(visitor.risk_score)}`}></div>
                                  <span className="text-xs">{visitor.risk_score}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-xs">{visitor.last_seen ? new Date(visitor.last_seen).toLocaleDateString() : '-'}</div>
                                <div className="text-xs text-gray-500">{visitor.last_seen ? new Date(visitor.last_seen).toLocaleTimeString() : ''}</div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-xs text-gray-400 space-y-0.5">
                                  {visitor.screen_resolution && <div>{visitor.screen_resolution}</div>}
                                  {visitor.timezone && <div>TZ: {visitor.timezone}</div>}
                                  {visitor.cpu_cores && <div>{visitor.cpu_cores} cores</div>}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Device Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OS Distribution */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Distribuicao de OS</h3>
                    <div className="space-y-2">
                      {['iOS', 'macOS', 'Android', 'Windows', 'Linux'].map(os => {
                        const count = networkVisitors.filter(v => v.is_same_network && v.os_type === os).length
                        const total = networkVisitors.filter(v => v.is_same_network).length || 1
                        const percent = Math.round((count / total) * 100)
                        return (
                          <div key={os} className="flex items-center gap-2">
                            <span className="w-20 text-sm text-gray-400">{os}</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  os === 'iOS' || os === 'macOS' ? 'bg-gray-400' :
                                  os === 'Android' ? 'bg-green-500' :
                                  os === 'Windows' ? 'bg-blue-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            <span className="w-16 text-right text-sm">{count} ({percent}%)</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Atividade Recente</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {networkVisitors
                        .filter(v => v.is_same_network)
                        .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
                        .slice(0, 10)
                        .map((v, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              new Date(v.last_seen) > new Date(Date.now() - 5 * 60 * 1000) ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="text-gray-400">{v.os_type}</span>
                            <span className="text-gray-500 flex-1 truncate">{v.fingerprint?.slice(0, 8)}...</span>
                            <span className="text-gray-500">{new Date(v.last_seen).toLocaleTimeString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Advanced Fingerprinting Info */}
                <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="font-semibold text-purple-300 mb-3">Fingerprinting Avancado Coletado</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Canvas Hash:</span>
                      <div className="font-mono text-gray-300 truncate">
                        {networkVisitors.find(v => v.canvas_hash)?.canvas_hash || 'Nenhum ainda'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">WebGL Hash:</span>
                      <div className="font-mono text-gray-300 truncate">
                        {networkVisitors.find(v => v.webgl_hash)?.webgl_hash || 'Nenhum ainda'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Audio Hash:</span>
                      <div className="font-mono text-gray-300 truncate">
                        {networkVisitors.find(v => v.audio_hash)?.audio_hash || 'Nenhum ainda'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">WebRTC IPs:</span>
                      <div className="font-mono text-gray-300">
                        {networkVisitors.filter(v => v.webrtc_ip).length} detectados
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    * Dados avancados serao coletados conforme visitantes acessarem o site com o script de fingerprinting ativo.
                  </p>
                </div>
              </div>
            )}

            {/* Correlation Tab */}
            {activeTab === 'correlation' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Known Attackers</h2>
                
                <div className="mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">🍎</div>
                    <div>
                      <h3 className="text-lg font-bold text-red-400">macOS Catalina 10.15.7 Attacker</h3>
                      <p className="text-gray-300">MacBook Pro/Air (2012-2016)</p>
                      <p className="text-sm text-gray-400">IP Público: 45.165.93.6 | ISP: LPCNET | Porto Alegre, RS</p>
                      <p className="text-sm text-yellow-400 mt-2">
                        Status: Atacante está na mesma infraestrutura de rede
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2">Redes Suspeitas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-bold">Ufibra (10.22.20.x)</h4>
                    <p className="text-sm text-gray-400">16 APs WPA2-Personal</p>
                    <p className="text-sm">~195 hosts detectados</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-bold">Uliving (10.0.0.x)</h4>
                    <p className="text-sm text-gray-400">MikroTik Hotspot / 2Bits</p>
                    <p className="text-sm">Portal: portal.ify.net.br</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Refresh Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}
