'use client'

import { useEffect, useState } from 'react'
import { supabase, Spotted, Comment, generateFingerprint } from '@/lib/supabase'
import { formatTextHtml } from '@/lib/moderacao'
import { REPORT_REASONS } from '@/lib/moderacao'

export default function SpottedList() {
  const [spotteds, setSpotteds] = useState<Spotted[]>([])
  const [loading, setLoading] = useState(true)
  const [likedSpotteds, setLikedSpotteds] = useState<string[]>([])
  const [openComments, setOpenComments] = useState<string[]>([])
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [reportingSpotted, setReportingSpotted] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportSuccess, setReportSuccess] = useState(false)

  useEffect(() => {
    if (supabase) {
      fetchSpotteds()
      const saved = localStorage.getItem('liked_spotteds')
      if (saved) setLikedSpotteds(JSON.parse(saved))
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

    if (data) setSpotteds(data as Spotted[])
    setLoading(false)
  }

  const fetchComments = async (spottedId: string) => {
    if (!supabase) return
    
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('spotted_id', spottedId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })

    if (data) {
      setComments(prev => ({ ...prev, [spottedId]: data as Comment[] }))
    }
  }

  const handleLike = async (id: string) => {
    if (!supabase || likedSpotteds.includes(id)) return
    
    const spotted = spotteds.find(s => s.id === id)
    const newLikes = (spotted?.likes || 0) + 1

    const { error } = await supabase
      .from('spotteds')
      .update({ likes: newLikes })
      .eq('id', id)

    if (!error) {
      setSpotteds(spotteds.map(s => s.id === id ? { ...s, likes: newLikes } : s))
      const newLiked = [...likedSpotteds, id]
      setLikedSpotteds(newLiked)
      localStorage.setItem('liked_spotteds', JSON.stringify(newLiked))
    }
  }

  const toggleComments = (id: string) => {
    if (openComments.includes(id)) {
      setOpenComments(openComments.filter(c => c !== id))
    } else {
      setOpenComments([...openComments, id])
      fetchComments(id)
    }
  }

  const handleAddComment = async (spottedId: string) => {
    if (!supabase) return
    
    const content = newComment[spottedId]?.trim()
    if (!content || content.length < 1 || content.length > 500) return

    const fingerprint = generateFingerprint()
    const contentHtml = formatTextHtml(content)

    const { error } = await supabase
      .from('comments')
      .insert([{
        spotted_id: spottedId,
        content,
        content_html: contentHtml,
        status: 'approved',
        author_fingerprint: fingerprint,
      }])

    if (!error) {
      setNewComment(prev => ({ ...prev, [spottedId]: '' }))
      fetchComments(spottedId)
    }
  }

  const handleReport = async (spottedId: string) => {
    if (!supabase || !reportReason.trim()) return

    const fingerprint = generateFingerprint()

    // Cria a denúncia
    const { error: reportError } = await supabase
      .from('reports')
      .insert([{
        spotted_id: spottedId,
        reason: reportReason,
        reporter_fingerprint: fingerprint,
        status: 'pending',
      }])

    if (reportError) {
      console.error('Erro ao denunciar:', reportError)
      return
    }

    // Atualiza contador de denúncias no spotted
    const spotted = spotteds.find(s => s.id === spottedId)
    const newReportsCount = (spotted?.reports_count || 0) + 1

    // Se tiver muitas denúncias, muda status para reported
    const newStatus = newReportsCount >= 3 ? 'reported' : 'approved'

    await supabase
      .from('spotteds')
      .update({ reports_count: newReportsCount, status: newStatus })
      .eq('id', spottedId)

    setReportingSpotted(null)
    setReportReason('')
    setReportSuccess(true)
    
    // Atualiza localmente
    setSpotteds(spotteds.map(s => 
      s.id === spottedId 
        ? { ...s, reports_count: newReportsCount, status: newStatus } 
        : s
    ))

    // Remove da lista se foi reportado
    if (newStatus === 'reported') {
      setSpotteds(prev => prev.filter(s => s.id !== spottedId))
    }

    setTimeout(() => setReportSuccess(false), 3000)
    fetchSpotteds()
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
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/spotted/${id}`)
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
          Nenhum spotted ainda.<br />
          <span className="text-gray-300">Seja o primeiro!</span>
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

      {/* Mensagem de denúncia sucesso */}
      {reportSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 animate-fade-in">
          Denúncia enviada com sucesso. Obrigado por ajudar a manter a comunidade segura!
        </div>
      )}

      {/* Lista de Spotteds */}
      <div className="space-y-4">
        {spotteds.map((spotted, index) => (
          <div
            key={spotted.id}
            className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Barra de cor no topo */}
            <div className="h-1 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500" />
            
            {/* Conteúdo */}
            <div className="p-5">
              {/* Número e data */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full text-sm font-bold text-pink-600">
                  #{spotted.number || '?'}
                </span>
                <span className="text-xs text-gray-400">{formatDate(spotted.created_at)}</span>
              </div>

              {/* Ícone anônimo e mensagem */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-gray-800 break-words leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: spotted.message_html || spotted.message }}
                  />
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  {/* Curtir */}
                  <button
                    onClick={() => handleLike(spotted.id)}
                    disabled={likedSpotteds.includes(spotted.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                      likedSpotteds.includes(spotted.id)
                        ? 'bg-red-50 text-red-500'
                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${likedSpotteds.includes(spotted.id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm font-medium">{spotted.likes || 0}</span>
                  </button>

                  {/* Comentários */}
                  <button
                    onClick={() => toggleComments(spotted.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                      openComments.includes(spotted.id)
                        ? 'bg-blue-50 text-blue-500'
                        : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm font-medium">{comments[spotted.id]?.length || 0}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
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

                  {/* Denunciar */}
                  <button
                    onClick={() => setReportingSpotted(spotted.id)}
                    className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                    title="Denunciar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Seção de comentários */}
              {openComments.includes(spotted.id) && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-fade-in">
                  {/* Lista de comentários */}
                  {comments[spotted.id]?.map((comment) => (
                    <div key={comment.id} className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-2">
                        <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: comment.content_html || comment.content }} />
                        <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                  ))}

                  {/* Input para novo comentário */}
                  <div className="flex gap-2 items-start mt-3">
                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={newComment[spotted.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [spotted.id]: e.target.value }))}
                      placeholder="Escreva um comentário..."
                      className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                      maxLength={500}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment(spotted.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(spotted.id)}
                      disabled={!newComment[spotted.id]?.trim()}
                      className="p-2 bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Denúncia */}
      {reportingSpotted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800">Denunciar Spotted</h3>
            <p className="text-sm text-gray-500">
              Ajude-nos a manter a comunidade segura. Denúncias anônimas são revisadas por moderadores.
            </p>
            
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label 
                  key={reason.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reportReason === reason.value 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason.value}
                    checked={reportReason === reason.value}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-4 h-4 text-pink-500"
                  />
                  <span className="text-sm text-gray-700">{reason.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setReportingSpotted(null); setReportReason(''); }}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReport(reportingSpotted)}
                disabled={!reportReason}
                className="flex-1 py-3 px-4 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Denunciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
