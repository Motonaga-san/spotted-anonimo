'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, Spotted, DailyStats } from '@/lib/supabase'
import { contemPalavraProibida } from '@/lib/moderacao'

export default function AdminPage() {
  const [spotteds, setSpotteds] = useState<Spotted[]>([])
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'reported' | 'all' | 'stats'>('reported')
  const [stats, setStats] = useState({
    totalSpotteds: 0,
    totalComments: 0,
    totalLikes: 0,
    reportedCount: 0,
    todaySpotteds: 0,
    todayViews: 0,
    weeklyData: [] as DailyStats[],
  })

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_auth')
    if (isAuth === 'true' && supabase) {
      setAuthenticated(true)
      fetchData()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    
    if (password === adminPassword) {
      sessionStorage.setItem('admin_auth', 'true')
      setAuthenticated(true)
      fetchData()
      setAuthError('')
    } else {
      setAuthError('Senha incorreta')
    }
  }

  const fetchData = async () => {
    if (!supabase) return

    const { data: allSpotteds } = await supabase
      .from('spotteds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    const { count: totalSpotteds } = await supabase
      .from('spotteds')
      .select('*', { count: 'exact', head: true })

    const { count: totalComments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })

    const { data: allSpottedsForLikes } = await supabase
      .from('spotteds')
      .select('likes')

    const today = new Date().toISOString().split('T')[0]
    const { count: todaySpotteds } = await supabase
      .from('spotteds')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    const { count: todayViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: weeklyData } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', weekAgo)

    const reported = allSpotteds?.filter(s => s.status === 'reported') || []

    setSpotteds((allSpotteds as Spotted[]) || [])
    setStats({
      totalSpotteds: totalSpotteds || 0,
      totalComments: totalComments || 0,
      totalLikes: allSpottedsForLikes?.reduce((sum, s) => sum + (s.likes || 0), 0) || 0,
      reportedCount: reported.length,
      todaySpotteds: todaySpotteds || 0,
      todayViews: todayViews || 0,
      weeklyData: (weeklyData as DailyStats[]) || [],
    })
    setLoading(false)
  }

  const approveSpotted = async (id: string) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'spotteds', id, data: { status: 'approved' } })
    })

    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'reports', spotted_id: id, data: { status: 'reviewed' } })
    })

    fetchData()
  }

  const hideSpotted = async (id: string) => {
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'spotteds', id, data: { status: 'hidden' } })
    })

    fetchData()
  }

  const deleteSpotted = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente?')) return
    
    const res = await fetch(`/api/admin?table=spotteds&id=${id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      alert('Erro ao excluir spotted')
      return
    }

    fetchData()
  }

  const dismissReports = async (spottedId: string) => {
    if (!supabase) return
    
    await supabase
      .from('reports')
      .update({ status: 'dismissed' })
      .eq('spotted_id', spottedId)

    await supabase
      .from('spotteds')
      .update({ status: 'approved' })
      .eq('id', spottedId)

    fetchData()
  }

  const resetCounter = async () => {
    if (!confirm('Tem certeza que deseja excluir TODOS os spotteds e reiniciar o contador? Esta ação é irreversível!')) return

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-counter' })
    })

    if (!res.ok) {
      const data = await res.json()
      alert('Erro: ' + data.error)
      return
    }

    const data = await res.json()
    alert(data.message)
    fetchData()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const displayedSpotteds = activeTab === 'reported' 
    ? spotteds.filter(s => s.status === 'reported')
    : spotteds

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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
            <p className="text-2xl font-bold text-green-400">{stats.todayViews}</p>
            <p className="text-xs text-gray-500">Visitas Hoje</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'reported', label: 'Denúncias', count: stats.reportedCount },
            { id: 'all', label: 'Todos os Spotteds', count: null },
            { id: 'stats', label: 'Estatísticas', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/25'
                  : 'bg-[#171717] text-gray-400 hover:bg-[#262626] border border-[#262626]'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={resetCounter}
            className="ml-auto px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all bg-red-600 hover:bg-red-700 text-white"
          >
            Reiniciar Contador
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'stats' ? (
          <div className="space-y-6">
            {/* Gráfico semanal */}
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

            {/* Resumo */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626]">
                <h3 className="font-bold text-white mb-4">Hoje</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Novos Spotteds</span>
                    <span className="font-bold text-white">{stats.todaySpotteds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Visitas</span>
                    <span className="font-bold text-white">{stats.todayViews}</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626]">
                <h3 className="font-bold text-white mb-4">Médias</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Curtidas/Post</span>
                    <span className="font-bold text-white">{stats.totalSpotteds > 0 ? Math.round(stats.totalLikes / stats.totalSpotteds) : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Comentários/Post</span>
                    <span className="font-bold text-white">{stats.totalSpotteds > 0 ? Math.round(stats.totalComments / stats.totalSpotteds) : 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedSpotteds.length === 0 ? (
              <div className="bg-[#171717] rounded-2xl p-8 text-center border border-[#262626]">
                <p className="text-gray-500">
                  {activeTab === 'reported' ? 'Nenhuma denúncia pendente!' : 'Nenhum spotted encontrado.'}
                </p>
              </div>
            ) : (
              displayedSpotteds.map((spotted) => {
                const toxicCheck = contemPalavraProibida(spotted.message)
                return (
                  <div
                    key={spotted.id}
                    className={`bg-[#171717] rounded-2xl border overflow-hidden ${
                      spotted.status === 'reported' ? 'border-orange-500/50' : 'border-[#262626]'
                    }`}
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs font-bold">
                            #{spotted.number}
                          </span>
                          {spotted.status === 'reported' && (
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                              denunciado
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(spotted.created_at)}</span>
                      </div>

                      {/* Mensagem */}
                      <p className="text-gray-300 whitespace-pre-wrap mb-3">{spotted.message}</p>

                      {/* Info adicional */}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{spotted.likes} curtidas</span>
                        {toxicCheck.contem && (
                          <>
                            <span>•</span>
                            <span className="text-orange-400">
                              Termos: {toxicCheck.categorias.join(', ')}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#262626]">
                        {spotted.status === 'reported' && (
                          <>
                            <button
                              onClick={() => approveSpotted(spotted.id)}
                              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => dismissReports(spotted.id)}
                              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600"
                            >
                              Descartar Denúncias
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => hideSpotted(spotted.id)}
                          className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
                        >
                          Ocultar
                        </button>
                        <button
                          onClick={() => deleteSpotted(spotted.id)}
                          className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
