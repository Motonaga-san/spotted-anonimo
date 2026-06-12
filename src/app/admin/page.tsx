'use client'

import { useState, useEffect } from 'react'
import { supabase, Spotted } from '@/lib/supabase'

export default function AdminPage() {
  const [spotteds, setSpotteds] = useState<Spotted[]>([])
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Verifica se já está autenticado (session storage)
    const isAuth = sessionStorage.getItem('admin_auth')
    if (isAuth === 'true') {
      setAuthenticated(true)
      fetchSpotteds()
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    
    if (password === adminPassword) {
      sessionStorage.setItem('admin_auth', 'true')
      setAuthenticated(true)
      fetchSpotteds()
      setAuthError('')
    } else {
      setAuthError('Senha incorreta')
    }
  }

  const fetchSpotteds = async () => {
    const { data } = await supabase
      .from('spotteds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setSpotteds(data)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('spotteds')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setSpotteds(spotteds.map(s => 
        s.id === id ? { ...s, status } : s
      ))
    }
  }

  const deleteSpotted = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return
    
    const { error } = await supabase
      .from('spotteds')
      .delete()
      .eq('id', id)

    if (!error) {
      setSpotteds(spotteds.filter(s => s.id !== id))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Admin - Spotted
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha de Administrador
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Digite a senha"
              />
            </div>
            {authError && (
              <p className="text-red-500 text-sm">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  const pending = spotteds.filter(s => s.status === 'pending').length
  const approved = spotteds.filter(s => s.status === 'approved').length
  const rejected = spotteds.filter(s => s.status === 'rejected').length

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Painel de Moderação
          </h1>
          <div className="flex gap-4 mt-4">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              Pendentes: {pending}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Aprovados: {approved}
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              Rejeitados: {rejected}
            </span>
          </div>
        </header>

        <main className="space-y-4">
          {spotteds.map((spotted) => (
            <div
              key={spotted.id}
              className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {spotted.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(spotted.status)}
                  <span className="text-xs text-gray-400">
                    {formatDate(spotted.created_at)}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {spotted.status !== 'approved' && (
                  <button
                    onClick={() => updateStatus(spotted.id, 'approved')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Aprovar
                  </button>
                )}
                {spotted.status !== 'rejected' && (
                  <button
                    onClick={() => updateStatus(spotted.id, 'rejected')}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Rejeitar
                  </button>
                )}
                <button
                  onClick={() => deleteSpotted(spotted.id)}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}
