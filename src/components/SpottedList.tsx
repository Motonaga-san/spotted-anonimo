'use client'

import { useEffect, useState } from 'react'
import { supabase, Spotted } from '@/lib/supabase'

export default function SpottedList() {
  const [spotteds, setSpotteds] = useState<Spotted[]>([])
  const [loading, setLoading] = useState(true)
  const [likedSpotteds, setLikedSpotteds] = useState<string[]>([])

  useEffect(() => {
    if (supabase) {
      fetchSpotteds()
      // Carrega spotteds curtidos do localStorage
      const saved = localStorage.getItem('liked_spotteds')
      if (saved) {
        setLikedSpotteds(JSON.parse(saved))
      }
    } else {
      setLoading(false)
    }
  }, [])

  const fetchSpotteds = async () => {
    const { data } = await supabase!
      .from('spotteds')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setSpotteds(data)
    setLoading(false)
  }

  const handleLike = async (id: string) => {
    if (!supabase) return
    
    // Verifica se já curtiu
    if (likedSpotteds.includes(id)) return

    // Incrementa o like no banco
    const spotted = spotteds.find(s => s.id === id)
    const newLikes = (spotted?.likes || 0) + 1

    const { error } = await supabase
      .from('spotteds')
      .update({ likes: newLikes })
      .eq('id', id)

    if (!error) {
      // Atualiza estado local
      setSpotteds(spotteds.map(s => 
        s.id === id ? { ...s, likes: newLikes } : s
      ))
      
      // Salva no localStorage
      const newLiked = [...likedSpotteds, id]
      setLikedSpotteds(newLiked)
      localStorage.setItem('liked_spotteds', JSON.stringify(newLiked))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora mesmo'
    if (diffMins < 60) return `${diffMins} min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const copyToClipboard = async (id: string) => {
    const url = `${window.location.origin}/spotted/${id}`
    await navigator.clipboard.writeText(url)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        <p className="text-gray-400">Carregando spotteds...</p>
      </div>
    )
  }

  if (spotteds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-gray-400 text-center">
          Nenhum spotted aprovado ainda.<br />
          <span className="text-gray-300">Seja o primeiro a enviar!</span>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
          Spotteds Recentes
        </h2>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
          {spotteds.length} {spotteds.length === 1 ? 'spotted' : 'spotteds'}
        </span>
      </div>

      {/* Lista de Spotteds */}
      <div className="space-y-4">
        {spotteds.map((spotted, index) => (
          <div
            key={spotted.id}
            className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Barra de cor no topo */}
            <div className="h-1 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500" />
            
            {/* Conteúdo */}
            <div className="p-5">
              {/* Ícone anônimo */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                    {spotted.message}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                {/* Data */}
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(spotted.created_at)}
                </span>

                {/* Ações */}
                <div className="flex items-center gap-3">
                  {/* Compartilhar */}
                  <button
                    onClick={() => copyToClipboard(spotted.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Copiar link"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l3.632 1.816m-3.632-4.5l3.632-1.816M12 9c.482 0 .938.114 1.342.316M12 9a3 3 0 100 6 3 3 0 000-6zm0 0c-.482 0-.938.114-1.342.316" />
                    </svg>
                  </button>

                  {/* Curtir */}
                  <button
                    onClick={() => handleLike(spotted.id)}
                    disabled={likedSpotteds.includes(spotted.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      likedSpotteds.includes(spotted.id)
                        ? 'bg-red-50 text-red-500'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <svg 
                      className={`w-4 h-4 ${likedSpotteds.includes(spotted.id) ? 'fill-current' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm font-medium">{spotted.likes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
