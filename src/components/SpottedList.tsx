'use client'
  
import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase, Spotted, Comment, generateFingerprint, getVisitorInfo, trackLike, trackCommentCreated, trackReport, trackClick, trackEvent } from '@/lib/supabase'
import { formatTextHtml, sanitizeHtml } from '@/lib/moderacao'
import { REPORT_REASONS } from '@/lib/moderacao'
import { useToast } from '@/context/ToastContext'
import { getFingerprintHash } from '@/utils/fingerprint'
 
export default function SpottedList() {
  const [spotteds, setSpotteds] = useState<Spotted[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 20
  const [likedSpotteds, setLikedSpotteds] = useState<string[]>([])
  const [likedComments, setLikedComments] = useState<string[]>([])
  const [openComments, setOpenComments] = useState<string[]>([])
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [reportingSpotted, setReportingSpotted] = useState<string | null>(null)
  const [reportingComment, setReportingComment] = useState<{ spottedId: string, commentId: string } | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [userFingerprint, setUserFingerprint] = useState<string>('')
  const { showToast } = useToast()
  
  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'likes' | 'comments'>('recent')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (supabase) {
      // Get user fingerprint for likes
      const fp = getFingerprintHash()
      setUserFingerprint(fp)
      
      fetchSpotteds(0)
      const savedSpotteds = localStorage.getItem('liked_spotteds')
      if (savedSpotteds) setLikedSpotteds(JSON.parse(savedSpotteds))
      const savedComments = localStorage.getItem('liked_comments')
      if (savedComments) setLikedComments(JSON.parse(savedComments))
    } else {
      setLoading(false)
    }
  }, [])

  // Track visualizações de spotteds
  useEffect(() => {
    if (spotteds.length > 0) {
      trackEvent('spotteds_viewed', { count: spotteds.length })
    }
  }, [spotteds.length])

  const fetchSpotteds = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    const offset = pageNum * pageSize
    
    const { data } = await supabase!
      .from('spotteds')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (data) {
      if (append) {
        setSpotteds(prev => [...prev, ...data as Spotted[]])
      } else {
        setSpotteds(data as Spotted[])
      }
      
      setHasMore(data.length === pageSize)
      
      // Buscar contagem de comentários para cada spotted
      const counts: Record<string, number> = {}
      const commentsData: Record<string, Comment[]> = {}
      
      for (const spotted of data) {
        const { count } = await supabase!
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('spotted_id', spotted.id)
          .eq('status', 'approved')
        
        counts[spotted.id] = count || 0
        
        // Se tiver comentários, buscar os dados
        if (count && count > 0) {
          const { data: commentsResult } = await supabase!
            .from('comments')
            .select('*')
            .eq('spotted_id', spotted.id)
            .eq('status', 'approved')
            .order('created_at', { ascending: true })
          
          if (commentsResult) {
            commentsData[spotted.id] = commentsResult as Comment[]
            // Expandir automaticamente se tiver comentários
            setOpenComments(prev => [...new Set([...prev, spotted.id])])
          }
        }
      }
      
      setCommentCounts(prev => ({ ...prev, ...counts }))
      setComments(prev => ({ ...prev, ...commentsData }))
    }
    
    setLoading(false)
    setLoadingMore(false)
  }, [])

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchSpotteds(nextPage, true)
    }
  }, [loadingMore, hasMore, page, fetchSpotteds])

  // Filtrar e ordenar spotteds
  const filteredSpotteds = useMemo(() => {
    let result = [...spotteds]
    
    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s => 
        s.message.toLowerCase().includes(query) ||
        `#${s.number}`.includes(query)
      )
    }
    
    // Ordenação
    switch (sortBy) {
      case 'likes':
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0))
        break
      case 'comments':
        result.sort((a, b) => (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0))
        break
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    
    return result
  }, [spotteds, searchQuery, sortBy, commentCounts])

  // Verificar se spotted é novo (< 1 hora)
  const isNewSpotted = useCallback((createdAt: string) => {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return new Date(createdAt) > hourAgo
  }, [])

  const fetchComments = useCallback(async (spottedId: string) => {
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
  }, [])

  const handleLike = useCallback(async (id: string) => {
    if (likedSpotteds.includes(id)) {
      showToast('Você já curtiu este spotted', 'info')
      return
    }
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'spotted', id, fingerprint: userFingerprint })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSpotteds(spotteds.map(s => s.id === id ? { ...s, likes: data.likes } : s))
        const newLiked = [...likedSpotteds, id]
        setLikedSpotteds(newLiked)
        localStorage.setItem('liked_spotteds', JSON.stringify(newLiked))
        showToast('Curtiu!', 'success')
        // Track do like
        trackLike('spotted', id)
      } else if (data.alreadyLiked) {
        // Já curtiu no servidor (outro dispositivo)
        const newLiked = [...likedSpotteds, id]
        setLikedSpotteds(newLiked)
        localStorage.setItem('liked_spotteds', JSON.stringify(newLiked))
        showToast('Você já curtiu este spotted', 'info')
      }
    } catch (error) {
      console.error('Erro ao dar like:', error)
      showToast('Erro ao curtir', 'error')
    }
  }, [likedSpotteds, spotteds, userFingerprint, showToast])

  const handleLikeComment = useCallback(async (spottedId: string, commentId: string) => {
    if (likedComments.includes(commentId)) {
      showToast('Você já curtiu este comentário', 'info')
      return
    }
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'comment', id: commentId, fingerprint: userFingerprint })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setComments(prev => ({
          ...prev,
          [spottedId]: prev[spottedId]?.map(c => 
            c.id === commentId ? { ...c, likes: data.likes } : c
          ) || []
        }))
        const newLiked = [...likedComments, commentId]
        setLikedComments(newLiked)
        localStorage.setItem('liked_comments', JSON.stringify(newLiked))
        showToast('Curtiu!', 'success')
        // Track do like
        trackLike('comment', commentId)
      } else if (data.alreadyLiked) {
        const newLiked = [...likedComments, commentId]
        setLikedComments(newLiked)
        localStorage.setItem('liked_comments', JSON.stringify(newLiked))
        showToast('Você já curtiu este comentário', 'info')
      }
    } catch (error) {
      console.error('Erro ao dar like:', error)
      showToast('Erro ao curtir', 'error')
    }
  }, [likedComments, comments, userFingerprint, showToast])

  const toggleComments = useCallback((id: string) => {
    if (openComments.includes(id)) {
      setOpenComments(openComments.filter(c => c !== id))
    } else {
      setOpenComments([...openComments, id])
      trackClick('open_comments', { spotted_id: id })
      if (!comments[id]) {
        fetchComments(id)
      }
    }
  }, [openComments, comments, fetchComments])

  const handleAddComment = useCallback(async (spottedId: string) => {
    const content = newComment[spottedId]?.trim()
    if (!content || content.length < 1 || content.length > 500) return

    const fingerprint = generateFingerprint()
    const visitorInfo = await getVisitorInfo()
    const contentHtml = formatTextHtml(content)

    // Usa API com service_role para evitar problemas de RLS
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spotted_id: spottedId,
        content,
        content_html: contentHtml,
        author_ip: visitorInfo.ip,
        author_fingerprint: fingerprint,
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Erro ao salvar comentário:', result.error)
      alert('Erro ao salvar comentário: ' + result.error)
      return
    }

    if (result.success && result.id) {
      setNewComment(prev => ({ ...prev, [spottedId]: '' }))
      fetchComments(spottedId)
      // Incrementar contador de comentários
      setCommentCounts(prev => ({
        ...prev,
        [spottedId]: (prev[spottedId] || 0) + 1
      }))
      showToast('Comentário adicionado!', 'success')
      // Track do comentário
      trackCommentCreated(spottedId, result.id)
      // Adicionar aos comentários abertos se não estiver
      if (!openComments.includes(spottedId)) {
        setOpenComments(prev => [...prev, spottedId])
      }
    }
  }, [newComment, openComments, fetchComments, showToast])

  const handleReport = useCallback(async (spottedId: string) => {
    if (!reportReason.trim()) return

    const fingerprint = generateFingerprint()
    const visitorInfo = await getVisitorInfo()

    // Usa API com service_role para atualizar status
    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'spotted',
        id: spottedId,
        reason: reportReason,
        reporterIp: visitorInfo.ip,
        reporterFingerprint: fingerprint,
      })
    })

    if (!response.ok) {
      console.error('Erro ao denunciar spotted')
      return
    }

    // Track da denúncia
    trackReport('spotted', spottedId, reportReason)

    setReportingSpotted(null)
    setReportReason('')
    showToast('Denúncia enviada com sucesso!', 'success')
    
    // Remove o spotted da lista local imediatamente
    setSpotteds(prev => prev.filter(s => s.id !== spottedId))
  }, [reportReason, showToast])

  const handleReportComment = useCallback(async (spottedId: string, commentId: string) => {
    if (!reportReason.trim()) return

    const fingerprint = generateFingerprint()
    const visitorInfo = await getVisitorInfo()

    // Usa API com service_role para atualizar status
    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'comment',
        id: commentId,
        spottedId: spottedId,
        reason: reportReason,
        reporterIp: visitorInfo.ip,
        reporterFingerprint: fingerprint,
      })
    })

    if (!response.ok) {
      console.error('Erro ao denunciar comentário')
      return
    }

    // Track da denúncia
    trackReport('comment', commentId, reportReason)

    setReportingComment(null)
    setReportReason('')
    showToast('Denúncia enviada com sucesso!', 'success')
    
    // Remove o comentário da lista local
    setComments(prev => ({
      ...prev,
      [spottedId]: prev[spottedId]?.filter(c => c.id !== commentId) || []
    }))
    
    // Atualizar contador
    setCommentCounts(prev => ({
      ...prev,
      [spottedId]: Math.max(0, (prev[spottedId] || 1) - 1)
    }))
  }, [reportReason, showToast])

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
    showToast('Link copiado!', 'success')
    trackClick('copy_link', { spotted_id: id })
  }

  // Skeleton loading component
  const SkeletonCard = () => (
    <div className="card-theme rounded-2xl shadow-lg shadow-pink-500/5 overflow-hidden animate-pulse">
      <div className="h-1 bg-gradient-to-r from-pink-500/30 to-orange-500/30" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="w-16 h-6 bg-input rounded-full" />
          <div className="w-20 h-4 bg-input rounded" />
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-input" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-input rounded w-3/4" />
            <div className="h-4 bg-input rounded w-1/2" />
            <div className="h-4 bg-input rounded w-2/3" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-border border-t">
          <div className="flex gap-2">
            <div className="w-16 h-8 bg-input rounded-full" />
            <div className="w-16 h-8 bg-input rounded-full" />
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-8 bg-input rounded-full" />
            <div className="w-8 h-8 bg-input rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="w-40 h-8 bg-input rounded animate-pulse" />
          <div className="w-20 h-6 bg-input rounded-full animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (spotteds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-20 h-20 card-theme rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-muted text-center">
          Nenhum spotted ainda.<br />
          <span className="text-muted">Seja o primeiro!</span>
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
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 card-theme rounded-full text-sm text-muted">
            {filteredSpotteds.length} {filteredSpotteds.length === 1 ? 'spotted' : 'spotteds'}
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-pink-500/20 text-pink-400' : 'text-muted hover:text-primary hover:bg-input'}`}
            title="Filtros"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm10 0a1 1 0 100-2 1 1 0 000 2zm0 4a1 1 0 100-2 1 1 0 000 2zm-4-8a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      {showFilters && (
        <div className="space-y-3 animate-fade-in">
          {/* Busca */}
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar spotteds..."
              className="w-full pl-10 pr-4 py-3 input-theme rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Ordenação */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'recent'
                  ? 'bg-pink-500 text-white'
                  : 'bg-input text-muted hover:text-primary'
              }`}
            >
              Mais recentes
            </button>
            <button
              onClick={() => setSortBy('likes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'likes'
                  ? 'bg-pink-500 text-white'
                  : 'bg-input text-muted hover:text-primary'
              }`}
            >
              Mais curtidos
            </button>
            <button
              onClick={() => setSortBy('comments')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'comments'
                  ? 'bg-pink-500 text-white'
                  : 'bg-input text-muted hover:text-primary'
              }`}
            >
              Mais comentados
            </button>
          </div>
        </div>
      )}

      {/* Lista de Spotteds */}
      <div className="space-y-4">
        {filteredSpotteds.length === 0 && !loading && (
          <div className="text-center py-12 card-theme rounded-2xl">
            <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-muted">Nenhum spotted encontrado</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-sm text-pink-400 hover:text-pink-300"
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
        
        {filteredSpotteds.map((spotted, index) => (
          <div
            key={spotted.id}
            className="group card-theme rounded-2xl shadow-lg shadow-pink-500/5 hover:shadow-pink-500/10 transition-all duration-300 overflow-hidden"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Barra de cor no topo */}
            <div className="h-1 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500" />
            
            {/* Conteúdo */}
            <div className="p-5">
              {/* Número e data */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-full text-sm font-bold text-pink-400">
                    #{spotted.number || '?'}
                  </span>
                  {isNewSpotted(spotted.created_at) && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium animate-pulse">
                      NOVO
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted" title={new Date(spotted.created_at).toLocaleString('pt-BR')}>
                  {formatDate(spotted.created_at)}
                </span>
              </div>

              {/* Ícone anônimo e mensagem */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-primary break-words leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(spotted.message_html || spotted.message) }}
                  />
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between mt-4 pt-4 border-border border-t">
                <div className="flex items-center gap-1">
                  {/* Curtir */}
                  <button
                    onClick={() => handleLike(spotted.id)}
                    disabled={likedSpotteds.includes(spotted.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                      likedSpotteds.includes(spotted.id)
                        ? 'bg-red-500/20 text-red-400'
                        : 'text-muted hover:text-red-400 hover:bg-red-500/10'
                    }`}
                  >
                    <svg className={`w-4 h-4 ${likedSpotteds.includes(spotted.id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm font-medium">{spotted.likes || 0}</span>
                  </button>

                  {/* Comentários - sempre mostra contador */}
                  <button
                    onClick={() => toggleComments(spotted.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                      openComments.includes(spotted.id)
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-muted hover:text-blue-400 hover:bg-blue-500/10'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm font-medium">{commentCounts[spotted.id] || 0}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Compartilhar */}
                  <button
                    onClick={() => copyToClipboard(spotted.id)}
                    className="p-2 text-muted hover:text-primary hover:bg-input rounded-full transition-colors"
                    title="Copiar link"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l3.632 1.816m-3.632-4.5l3.632-1.816M12 9c.482 0 .938.114 1.342.316M12 9a3 3 0 100 6 3 3 0 000-6zm0 0c-.482 0-.938.114-1.342.316" />
                    </svg>
                  </button>

                  {/* Denunciar */}
                  <button
                    onClick={() => setReportingSpotted(spotted.id)}
                    className="p-2 text-muted hover:text-orange-400 hover:bg-orange-500/10 rounded-full transition-colors"
                    title="Denunciar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Seção de comentários - apenas se expandido */}
              {openComments.includes(spotted.id) && (
                <div className="mt-4 pt-4 border-border border-t space-y-3 animate-fade-in">
                  {/* Lista de comentários */}
                  {comments[spotted.id]?.map((comment) => (
                    <div key={comment.id} className="flex gap-2 items-start group/comment">
                      <div className="w-6 h-6 rounded-full bg-input flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-input rounded-lg p-2">
                        <p className="text-sm text-primary" dangerouslySetInnerHTML={{ __html: sanitizeHtml(comment.content_html || comment.content) }} />
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted">{formatDate(comment.created_at)}</span>
                          <div className="flex items-center gap-2">
                            {/* Curtir comentário */}
                            <button
                              onClick={() => handleLikeComment(spotted.id, comment.id)}
                              disabled={likedComments.includes(comment.id)}
                              className={`flex items-center gap-1 text-xs transition-all ${
                                likedComments.includes(comment.id)
                                  ? 'text-red-400'
                                  : 'text-muted hover:text-red-400'
                              }`}
                              title="Curtir comentário"
                            >
                              <svg className={`w-3 h-3 ${likedComments.includes(comment.id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>{comment.likes || 0}</span>
                            </button>
                            {/* Denunciar comentário */}
                            <button
                              onClick={() => setReportingComment({ spottedId: spotted.id, commentId: comment.id })}
                              className="text-xs text-muted hover:text-orange-400 transition-colors"
                              title="Denunciar comentário"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {comments[spotted.id]?.length === 0 && (
                    <p className="text-xs text-muted text-center py-2">Nenhum comentário ainda</p>
                  )}

                  {/* Input para novo comentário */}
                  <div className="flex gap-2 items-start mt-3">
                    <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={newComment[spotted.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [spotted.id]: e.target.value }))}
                      placeholder="Escreva um comentário..."
                      className="flex-1 p-2 input-theme rounded-lg text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
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

      {/* Botão Carregar Mais */}
      {hasMore && spotteds.length > 0 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Carregar mais spotteds
              </>
            )}
          </button>
        </div>
      )}

      {/* Mensagem quando não há mais spotteds */}
      {!hasMore && spotteds.length > 0 && (
        <p className="text-center text-muted text-sm py-4">
          Você viu todos os {spotteds.length} spotteds!
        </p>
      )}

      {/* Modal de Denúncia de Spotted */}
      {reportingSpotted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card-theme rounded-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <h3 className="text-xl font-bold text-primary">Denunciar Spotted</h3>
            
            {/* Preview do conteúdo sendo denunciado */}
            <div className="p-3 bg-input rounded-xl border border-border">
              <p className="text-xs text-muted mb-2">Você está denunciando:</p>
              <p className="text-sm text-primary line-clamp-3">
                {spotteds.find(s => s.id === reportingSpotted)?.message}
              </p>
            </div>
            
            <p className="text-sm text-muted">
              Ajude-nos a manter a comunidade segura. Denúncias anônimas são revisadas por moderadores.
            </p>
            
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label 
                  key={reason.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reportReason === reason.value 
                      ? 'border-pink-500 bg-pink-500/10' 
                      : 'border-border hover:border-pink-500/50'
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
                  <span className="text-sm text-secondary">{reason.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setReportingSpotted(null); setReportReason(''); }}
                className="flex-1 py-3 px-4 bg-input text-secondary font-medium rounded-xl hover:opacity-80 transition-colors"
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

      {/* Modal de Denúncia de Comentário */}
      {reportingComment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card-theme rounded-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <h3 className="text-xl font-bold text-primary">Denunciar Comentário</h3>
            
            {/* Preview do comentário sendo denunciado */}
            <div className="p-3 bg-input rounded-xl border border-border">
              <p className="text-xs text-muted mb-2">Você está denunciando:</p>
              <p className="text-sm text-primary">
                {comments[reportingComment.spottedId]?.find(c => c.id === reportingComment.commentId)?.content}
              </p>
            </div>
            
            <p className="text-sm text-muted">
              Ajude-nos a manter a comunidade segura. Denúncias anônimas são revisadas por moderadores.
            </p>
            
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label 
                  key={reason.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    reportReason === reason.value 
                      ? 'border-pink-500 bg-pink-500/10' 
                      : 'border-border hover:border-pink-500/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReasonComment"
                    value={reason.value}
                    checked={reportReason === reason.value}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-4 h-4 text-pink-500"
                  />
                  <span className="text-sm text-secondary">{reason.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setReportingComment(null); setReportReason(''); }}
                className="flex-1 py-3 px-4 bg-input text-secondary font-medium rounded-xl hover:opacity-80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReportComment(reportingComment.spottedId, reportingComment.commentId)}
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
