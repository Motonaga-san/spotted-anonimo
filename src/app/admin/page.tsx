'use client'
 
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, Spotted, Comment, DailyStats } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
 
export default function AdminPage() {
  const [spotteds, setSpotteds] = useState<Spotted[]>([])
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'reported' | 'all' | 'stats'>('reported')
  const [reportedComments, setReportedComments] = useState<Comment[]>([])
  const [stats, setStats] = useState({
    totalSpotteds: 0,
    totalComments: 0,
    totalLikes: 0,
    reportedCount: 0,
    todaySpotteds: 0,
    todayViews: 0,
    todayUniqueVisitors: 0,
    todaySessions: 0,
    weeklyData: [] as DailyStats[],
  })
  const { showToast } = useToast()

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token')
    if (token) {
      fetch('/api/admin/auth', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.authenticated) {
            setAuthenticated(true)
            fetchData()
          } else {
            sessionStorage.removeItem('admin_token')
            setLoading(false)
          }
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      
      const data = await response.json()
      
      if (data.success && data.token) {
        sessionStorage.setItem('admin_token', data.token)
        setAuthenticated(true)
        showToast('Login realizado!', 'success')
        fetchData()
      } else {
        setAuthError('Senha incorreta')
        showToast('Senha incorreta', 'error')
      }
    } catch {
      setAuthError('Erro ao autenticar')
      showToast('Erro ao autenticar', 'error')
    }
  }

  const fetchData = async () => {
    setLoading(true)

    // Buscar spotteds e comentários reportados via API
    const reportedRes = await fetch('/api/admin?action=get-reported')
    const reportedData = await reportedRes.json()
    const reportedSpottedsData = reportedData.spotteds || []
    const reportedCommentsData = reportedData.comments || []

    // Buscar total de spotteds
    const { count: totalSpotteds } = await supabase!
      .from('spotteds')
      .select('*', { count: 'exact', head: true })

    const { count: totalComments } = await supabase!
      .from('comments')
      .select('*', { count: 'exact', head: true })

    const { data: allSpottedsForLikes } = await supabase!
      .from('spotteds')
      .select('likes')

    const today = new Date().toISOString().split('T')[0]
    const { count: todaySpotteds } = await supabase!
      .from('spotteds')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    // Buscar estatísticas de visitas da API de analytics
    let todayViews = 0
    let todayUniqueVisitors = 0
    let todaySessions = 0
    try {
      const analyticsRes = await fetch('/api/analytics?action=get-stats&days=1')
      const analyticsData = await analyticsRes.json()
      todayViews = analyticsData.totalEvents || 0
      todayUniqueVisitors = analyticsData.uniqueVisitors || 0
      todaySessions = analyticsData.totalSessions || 0
    } catch {
      console.error('Erro ao buscar analytics')
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: weeklyData } = await supabase!
      .from('daily_stats')
      .select('*')
      .gte('date', weekAgo)

    setSpotteds(reportedSpottedsData as Spotted[])
    setReportedComments(reportedCommentsData as Comment[])
    setStats({
      totalSpotteds: totalSpotteds || 0,
      totalComments: totalComments || 0,
      totalLikes: allSpottedsForLikes?.reduce((sum, s) => sum + (s.likes || 0), 0) || 0,
      reportedCount: reportedSpottedsData.length + reportedCommentsData.length,
      todaySpotteds: todaySpotteds || 0,
      todayViews: todayViews || 0,
      todayUniqueVisitors: todayUniqueVisitors || 0,
      todaySessions: todaySessions || 0,
      weeklyData: (weeklyData as DailyStats[]) || [],
    })
    setLoading(false)
  }

  // Ação: Retornar para o público (aprovar)
  const handleApprove = async (type: 'spotted' | 'comment', id: string) => {
    const table = type === 'spotted' ? 'spotteds' : 'comments'
    
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id, data: { status: 'approved' } })
    })

    if (res.ok) {
      showToast(`${type === 'spotted' ? 'Spotted' : 'Comentário'} aprovado!`, 'success')
      fetchData()
    } else {
      showToast('Erro ao aprovar', 'error')
    }
  }

  // Ação: Ocultar
  const handleHide = async (type: 'spotted' | 'comment', id: string) => {
    const table = type === 'spotted' ? 'spotteds' : 'comments'
    
    const res = await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id, data: { status: 'hidden' } })
    })

    if (res.ok) {
      showToast(`${type === 'spotted' ? 'Spotted' : 'Comentário'} ocultado!`, 'success')
      fetchData()
    } else {
      showToast('Erro ao ocultar', 'error')
    }
  }

  // Ação: Remover (excluir permanentemente)
  const handleDelete = async (type: 'spotted' | 'comment', id: string) => {
    if (!confirm('Tem certeza que deseja remover permanentemente?')) return
    
    const table = type === 'spotted' ? 'spotteds' : 'comments'
    
    const res = await fetch(`/api/admin?table=${table}&id=${id}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      showToast(`${type === 'spotted' ? 'Spotted' : 'Comentário'} removido!`, 'success')
      fetchData()
    } else {
      showToast('Erro ao remover', 'error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#171717] border border-[#262626] rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg shadow-pink-500/25 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
            <p className="text-gray-500 mt-1">Spotted 2.0</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Senha de Administrador
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-[#262626] border-2 border-[#404040] rounded-xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-white placeholder-gray-500"
                placeholder="Digite a senha"
              />
            </div>
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#171717] border-b border-[#262626] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Painel Admin</h1>
                <p className="text-xs text-gray-500">Spotted 2.0</p>
              </div>
            </div>
            <Link href="/" className="text-sm text-gray-500 hover:text-white flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao site
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
            <p className="text-2xl font-bold text-white">{stats.totalSpotteds}</p>
            <p className="text-xs text-gray-500">Total Spotteds</p>
          </div>
          <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
            <p className="text-2xl font-bold text-blue-400">{stats.totalComments}</p>
            <p className="text-xs text-gray-500">Comentários</p>
          </div>
          <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
            <p className="text-2xl font-bold text-red-400">{stats.totalLikes}</p>
            <p className="text-xs text-gray-500">Curtidas</p>
          </div>
          <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
            <p className="text-2xl font-bold text-orange-400">{stats.reportedCount}</p>
            <p className="text-xs text-gray-500">Reportados</p>
          </div>
          <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
            <p className="text-2xl font-bold text-green-400">{stats.todayUniqueVisitors}</p>
            <p className="text-xs text-gray-500">Visitantes Hoje</p>
          </div>
          <div className="bg-[#171717] rounded-xl p-4 border border-[#262626]">
            <p className="text-2xl font-bold text-purple-400">{stats.todaySessions}</p>
            <p className="text-xs text-gray-500">Sessões Hoje</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('reported')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'reported'
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/25'
                : 'bg-[#171717] text-gray-400 hover:bg-[#262626] border border-[#262626]'
            }`}
          >
            Denúncias
            {stats.reportedCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {stats.reportedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/25'
                : 'bg-[#171717] text-gray-400 hover:bg-[#262626] border border-[#262626]'
            }`}
          >
            Estatísticas
          </button>
        </div>

        {/* Conteúdo */}
        {activeTab === 'stats' ? (
          <div className="space-y-6">
            <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626]">
              <h3 className="font-bold text-white mb-4">Atividade da Semana</h3>
              <div className="flex items-end gap-2 h-40">
                {stats.weeklyData.length > 0 ? stats.weeklyData.map((day) => {
                  const height = day.spotteds_created ? Math.min(day.spotteds_created * 20, 100) : 5
                  const date = new Date(day.date)
                  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' })
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-gradient-to-t from-pink-500 to-orange-400 rounded-t-lg"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-500">{dayName}</span>
                      <span className="text-xs text-gray-400">{day.spotteds_created} posts</span>
                    </div>
                  )
                }) : (
                  <p className="text-gray-500 text-sm w-full text-center">Sem dados suficientes</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {spotteds.length === 0 && reportedComments.length === 0 ? (
              <div className="bg-[#171717] rounded-2xl p-8 text-center border border-[#262626]">
                <p className="text-gray-500">Nenhuma denúncia pendente!</p>
              </div>
            ) : (
              <>
                {/* Comentários Reportados */}
                {reportedComments.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Comentários Denunciados ({reportedComments.length})
                    </h3>
                    {reportedComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-[#171717] rounded-2xl border border-orange-500/50 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                              Comentário
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                          </div>
                          <p className="text-gray-300 whitespace-pre-wrap mb-3">{comment.content}</p>
                          <div className="text-xs text-gray-500 mb-3">
                            {comment.likes} curtidas
                          </div>
                          {/* Botões simplificados */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-[#262626]">
                            <button
                              onClick={() => handleApprove('comment', comment.id)}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                            >
                              Retornar ao público
                            </button>
                            <button
                              onClick={() => handleHide('comment', comment.id)}
                              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700"
                            >
                              Ocultar
                            </button>
                            <button
                              onClick={() => handleDelete('comment', comment.id)}
                              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Spotteds Reportados */}
                {spotteds.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2 mt-6">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Spotteds Denunciados ({spotteds.length})
                    </h3>
                    {spotteds.map((spotted) => (
                      <div
                        key={spotted.id}
                        className="bg-[#171717] rounded-2xl border border-orange-500/50 overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs font-bold">
                              #{spotted.number}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(spotted.created_at)}</span>
                          </div>
                          <p className="text-gray-300 whitespace-pre-wrap mb-3">{spotted.message}</p>
                          <div className="text-xs text-gray-500 mb-3">
                            {spotted.likes} curtidas
                          </div>
                          {/* Botões simplificados */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-[#262626]">
                            <button
                              onClick={() => handleApprove('spotted', spotted.id)}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                            >
                              Retornar ao público
                            </button>
                            <button
                              onClick={() => handleHide('spotted', spotted.id)}
                              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700"
                            >
                              Ocultar
                            </button>
                            <button
                              onClick={() => handleDelete('spotted', spotted.id)}
                              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
