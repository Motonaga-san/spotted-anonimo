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

export default function SecurityDashboard() {
  const [sessions, setSessions] = useState<VisitorSession[]>([])
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [devices, setDevices] = useState<NetworkDevice[]>([])
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

      // Buscar eventos de segurança
      const { data: eventsData } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (eventsData) setEvents(eventsData as SecurityEvent[])

      // Buscar dispositivos de rede
      const { data: devicesData } = await supabase
        .from('network_devices')
        .select('*')
        .order('last_seen', { ascending: false })
        .limit(100)
      
      if (devicesData) setDevices(devicesData as NetworkDevice[])

      // Calcular estatísticas
      const totalSessions = sessionsData?.length || 0
      const attackers = sessionsData?.filter(s => s.is_attacker).length || 0
      const suspicious = sessionsData?.filter(s => s.is_suspicious).length || 0
      const appleDevices = devicesData?.filter(d => d.vendor === 'Apple').length || 0
      
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
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Severity</th>
                      <th className="px-4 py-3 text-left">IP</th>
                      <th className="px-4 py-3 text-left">Action</th>
                      <th className="px-4 py-3 text-left">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {events.map(event => (
                      <tr key={event.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(event.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded text-xs bg-gray-600">
                            {event.event_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(event.severity)}`}>
                            {event.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {event.ip_address}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {event.action}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-xs">
                          {event.content_preview || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === 'devices' && (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">IP</th>
                      <th className="px-4 py-3 text-left">MAC</th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">SSID</th>
                      <th className="px-4 py-3 text-left">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {devices.map((device, i) => (
                      <tr key={i} className={`hover:bg-gray-700/50 ${device.vendor === 'Apple' ? 'bg-blue-900/20' : ''}`}>
                        <td className="px-4 py-3 font-mono">{device.ip_address}</td>
                        <td className="px-4 py-3 font-mono text-sm">{device.mac_address}</td>
                        <td className="px-4 py-3">
                          {device.vendor === 'Apple' && (
                            <span className="bg-blue-600 px-2 py-1 rounded text-xs">APPLE</span>
                          )}
                          {device.vendor}
                        </td>
                        <td className="px-4 py-3">{device.device_type}</td>
                        <td className="px-4 py-3">{device.ssid || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(device.last_seen).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
