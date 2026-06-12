'use client'

import { useEffect, useState } from 'react'
import { supabase, Spotted, DailyStats } from '@/lib/supabase'

export default function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSpotteds: 0,
    totalComments: 0,
    totalLikes: 0,
    totalViews: 0,
    todaySpotteds: 0,
    todayViews: 0,
    avgLikes: 0,
    avgComments: 0,
    weeklyData: [] as DailyStats[],
    recentSpotteds: [] as Spotted[],
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const { count: totalSpotteds } = await supabase
      .from('spotteds')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    const { count: totalComments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    const today = new Date().toISOString().split('T')[0]
    const { count: todaySpotteds } = await supabase
      .from('spotteds')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    const { count: todayViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    const { data: recentSpotteds } = await supabase
      .from('spotteds')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5)

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: weeklyData } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', weekAgo)
      .order('date', { ascending: true })

    const { data: allSpotteds } = await supabase
      .from('spotteds')
      .select('likes')
      .eq('status', 'approved')

    const totalLikes = allSpotteds?.reduce((sum, s) => sum + (s.likes || 0), 0) || 0

    setStats({
      totalSpotteds: totalSpotteds || 0,
      totalComments: totalComments || 0,
      totalLikes,
      totalViews: 0,
      todaySpotteds: todaySpotteds || 0,
      todayViews: todayViews || 0,
      avgLikes: allSpotteds?.length ? Math.round(totalLikes / allSpotteds.length) : 0,
      avgComments: 0,
      weeklyData: (weeklyData as DailyStats[]) || [],
      recentSpotteds: (recentSpotteds as Spotted[]) || [],
    })

    setLoading(false)
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
      <header className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Estatísticas</h1>
          <p className="text-white/80">Métricas e analytics do Spotted 2.0</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalSpotteds}</p>
            <p className="text-sm text-gray-500">Spotteds Totais</p>
          </div>

          <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalComments}</p>
            <p className="text-sm text-gray-500">Comentários</p>
          </div>

          <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalLikes}</p>
            <p className="text-sm text-gray-500">Curtidas</p>
          </div>

          <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626]">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{stats.todayViews}</p>
            <p className="text-sm text-gray-500">Visitas Hoje</p>
          </div>
        </div>

        {/* Médias */}
        <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626] mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Médias por Spotted</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#262626] rounded-xl">
              <p className="text-2xl font-bold text-pink-400">{stats.avgLikes}</p>
              <p className="text-xs text-gray-500">Curtidas</p>
            </div>
            <div className="text-center p-4 bg-[#262626] rounded-xl">
              <p className="text-2xl font-bold text-blue-400">{stats.avgComments}</p>
              <p className="text-xs text-gray-500">Comentários</p>
            </div>
            <div className="text-center p-4 bg-[#262626] rounded-xl">
              <p className="text-2xl font-bold text-orange-400">{stats.todaySpotteds}</p>
              <p className="text-xs text-gray-500">Posts Hoje</p>
            </div>
            <div className="text-center p-4 bg-[#262626] rounded-xl">
              <p className="text-2xl font-bold text-purple-400">20h</p>
              <p className="text-xs text-gray-500">Horário de Pico</p>
            </div>
          </div>
        </div>

        {/* Gráfico semanal */}
        <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626] mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Últimos 7 Dias</h2>
          <div className="flex items-end gap-2 h-40">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => {
              const dayData = stats.weeklyData.find(d => {
                const date = new Date(d.date)
                return date.getDay() === i
              })
              const height = dayData?.spotteds_created ? Math.min(dayData.spotteds_created * 20, 100) : 5
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-pink-500 to-orange-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500">{day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Spotteds recentes */}
        <div className="bg-[#171717] rounded-2xl p-6 border border-[#262626]">
          <h2 className="text-xl font-bold text-white mb-4">Spotteds Recentes</h2>
          <div className="space-y-3">
            {stats.recentSpotteds.map((spotted) => (
              <div key={spotted.id} className="flex items-start gap-3 p-3 bg-[#262626] rounded-xl">
                <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs font-bold">
                  #{spotted.number}
                </span>
                <p className="flex-1 text-sm text-gray-300 line-clamp-2">{spotted.message}</p>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {spotted.likes}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Link voltar */}
        <div className="text-center mt-8">
          <a href="/" className="text-pink-400 hover:text-pink-300 font-medium">
            ← Voltar ao Spotted
          </a>
        </div>
      </main>
    </div>
  )
}
