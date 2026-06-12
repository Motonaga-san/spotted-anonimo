'use client'

import { useState, useEffect } from 'react'
import { supabase, Spotted } from '@/lib/supabase'
import { contemPalavraProibida } from '@/lib/moderacao'

export default function AdminPage() {
  const [spotteds, setSpotteds] = useState<Spotted[]>([])
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedSpotted, setSelectedSpotted] = useState<Spotted | null>(null)
  const [actionLog, setActionLog] = useState<string[]>([])

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_auth')
    if (isAuth === 'true' && supabase) {
      setAuthenticated(true)
      fetchSpotteds()
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
      if (supabase) fetchSpotteds()
      setAuthError('')
      addLog('Login realizado')
    } else {
      setAuthError('Senha incorreta')
    }
  }

  const fetchSpotteds = async () => {
    if (!supabase) return
    
    const { data } = await supabase
      .from('spotteds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (data) setSpotteds(data)
    setLoading(false)
  }

  const addLog = (action: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR')
    setActionLog(prev => [`[${timestamp}] ${action}`, ...prev.slice(0, 9)])
  }

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!supabase) return
    
    const { error } = await supabase
      .from('spotteds')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setSpotteds(spotteds.map(s => 
        s.id === id ? { ...s, status } : s
      ))
      addLog(`Spotted ${id.slice(0, 8)}... ${status === 'approved' ? 'aprovado' : 'rejeitado'}`)
      setSelectedSpotted(null)
    }
  }

  const deleteSpotted = async (id: string) => {
    if (!supabase || !confirm('Tem certeza que deseja excluir?')) return
    
    const { error } = await supabase
      .from('spotteds')
      .delete()
      .eq('id', id)

    if (!error) {
      setSpotteds(spotteds.filter(s => s.id !== id))
      addLog(`Spotted ${id.slice(0, 8)}... excluído`)
      setSelectedSpotted(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const filteredSpotteds = spotteds.filter(s => 
    filter === 'all' ? true : s.status === filter
  )

  const stats = {
    total: spotteds.length,
    pending: spotteds.filter(s => s.status === 'pending').length,
    approved: spotteds.filter(s => s.status === 'approved').length,
    rejected: spotteds.filter(s => s.status === 'rejected').length,
    totalLikes: spotteds.reduce((sum, s) => sum + (s.likes || 0), 0)
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Painel Admin</h1>
            <p className="text-gray-500 mt-1">Spotted Anônimo</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha de Administrador
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-200 focus:border-pink-400 transition-all text-gray-700"
                placeholder="Digite a senha"
              />
            </div>
            {authError && (
              <p className="text-red-500 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Painel de Moderação</h1>
                <p className="text-xs text-gray-500">{stats.total} spotteds no total</p>
              </div>
            </div>
            <a 
              href="/" 
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar ao site
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Stats e Log */}
          <aside className="lg:w-72 space-y-4">
            {/* Stats */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Estatísticas</h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                  <span className="text-yellow-700 text-sm">Pendentes</span>
                  <span className="text-xl font-bold text-yellow-700">{stats.pending}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <span className="text-green-700 text-sm">Aprovados</span>
                  <span className="text-xl font-bold text-green-700">{stats.approved}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <span className="text-red-700 text-sm">Rejeitados</span>
                  <span className="text-xl font-bold text-red-700">{stats.rejected}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                  <span className="text-pink-700 text-sm">Curtidas</span>
                  <span className="text-xl font-bold text-pink-700">{stats.totalLikes}</span>
                </div>
              </div>
            </div>

            {/* Log de ações */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Atividades Recentes</h3>
              <div className="space-y-2 text-xs text-gray-500">
                {actionLog.length === 0 ? (
                  <p className="text-gray-400">Nenhuma ação ainda</p>
                ) : (
                  actionLog.map((log, i) => (
                    <p key={i} className="font-mono">{log}</p>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Filtros */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                    filter === f
                      ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {f === 'pending' && `Pendentes (${stats.pending})`}
                  {f === 'approved' && `Aprovados (${stats.approved})`}
                  {f === 'rejected' && `Rejeitados (${stats.rejected})`}
                  {f === 'all' && `Todos (${stats.total})`}
                </button>
              ))}
            </div>

            {/* Lista */}
            {filteredSpotteds.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <p className="text-gray-400">Nenhum spotted encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSpotteds.map((spotted) => {
                  const toxicCheck = contemPalavraProibida(spotted.message)
                  return (
                    <div
                      key={spotted.id}
                      className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                        selectedSpotted?.id === spotted.id ? 'ring-2 ring-pink-500' : 'border-gray-100'
                      }`}
                    >
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => setSelectedSpotted(selectedSpotted?.id === spotted.id ? null : spotted)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 whitespace-pre-wrap break-words line-clamp-3">
                              {spotted.message}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              {/* Status badge */}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                spotted.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                spotted.status === 'approved' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {spotted.status === 'pending' ? 'Pendente' :
                                 spotted.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                              </span>
                              
                              {/* Warning de toxicidade */}
                              {toxicCheck.contem && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  Contém termos sensíveis
                                </span>
                              )}
                              
                              {/* Likes */}
                              {spotted.likes > 0 && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  {spotted.likes}
                                </span>
                              )}
                              
                              {/* Data */}
                              <span className="text-xs text-gray-400">
                                {formatDate(spotted.created_at)}
                              </span>
                            </div>
                          </div>

                          {/* Indicador de expansão */}
                          <svg 
                            className={`w-5 h-5 text-gray-300 transition-transform ${selectedSpotted?.id === spotted.id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Ações (expandido) */}
                      {selectedSpotted?.id === spotted.id && (
                        <div className="px-4 pb-4 pt-0 space-y-4 animate-fade-in">
                          {/* Mensagem completa */}
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-gray-700 whitespace-pre-wrap">{spotted.message}</p>
                          </div>
                          
                          {/* Detalhes de toxicidade */}
                          {toxicCheck.contem && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                              <p className="text-sm text-orange-700">
                                <strong>Categorias detectadas:</strong> {toxicCheck.categorias.join(', ')}
                              </p>
                              <p className="text-xs text-orange-600 mt-1">
                                Termos: {toxicCheck.palavrasEncontradas.slice(0, 5).join(', ')}
                                {toxicCheck.palavrasEncontradas.length > 5 && '...'}
                              </p>
                            </div>
                          )}

                          {/* Botões de ação */}
                          <div className="flex flex-wrap gap-2">
                            {spotted.status !== 'approved' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus(spotted.id, 'approved'); }}
                                className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Aprovar
                              </button>
                            )}
                            {spotted.status !== 'rejected' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus(spotted.id, 'rejected'); }}
                                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Rejeitar
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSpotted(spotted.id); }}
                              className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
