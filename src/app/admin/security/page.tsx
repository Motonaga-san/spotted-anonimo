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

export default function SecurityDashboard() {
  const [sessions, setSessions] = useState<VisitorSession[]>([])
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [devices, setDevices] = useState<NetworkDevice[]>([])
  const [uniqueDevices, setUniqueDevices] = useState<UniqueDevice[]>([])
  const [stats, setStats] = useState({
    totalSessions: 0,
    attackers: 0,
    suspicious: 0,
    appleDevices: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'sessions' | 'events' | 'devices' | 'correlation'>('sessions')

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'danger': return 'text-orange-600 bg-orange-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

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
        <div className="flex space-x-2 mb-6">
          {(['sessions', 'events', 'devices', 'correlation'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">IP</th>
                      <th className="px-4 py-3 text-left">Device</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Risk</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                      <th className="px-4 py-3 text-left">Last Active</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {sessions.map(session => (
                      <tr key={session.session_id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <div className="font-mono">{session.ip_address}</div>
                          <div className="text-xs text-gray-500">{session.country || 'Unknown'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{session.os_type} {session.os_version}</div>
                          <div className="text-xs text-gray-500">{session.browser} / {session.device_brand} {session.device_model}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{session.city || '-'}</div>
                          <div className="text-xs text-gray-500">{session.country || '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-16 h-2 rounded ${getRiskColor(session.risk_score)}`}></div>
                            <span className="text-sm">{session.risk_score}</span>
                          </div>
                          {session.is_attacker && (
                            <span className="text-xs bg-red-600 px-2 py-1 rounded">ATTACKER</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {session.spotteds_created} spotteds, {session.comments_created} comments
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {new Date(session.last_activity).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => markAsAttacker(session.session_id, !session.is_attacker)}
                              className={`px-2 py-1 rounded text-xs ${
                                session.is_attacker 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-red-600 hover:bg-red-700'
                              }`}
                            >
                              {session.is_attacker ? 'Unmark' : 'Mark Attacker'}
                            </button>
                            <button
                              onClick={() => blockIP(session.ip_address)}
                              className="px-2 py-1 rounded text-xs bg-gray-600 hover:bg-gray-500"
                            >
                              Block IP
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
