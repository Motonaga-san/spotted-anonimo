'use client'

import { useEffect, useState } from 'react'
import { supabase, Spotted } from '@/lib/supabase'

export default function SpottedList() {
  const [spotteds, setSpotteds] = useState<Spotted[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpotteds()
  }, [])

  const fetchSpotteds = async () => {
    const { data } = await supabase
      .from('spotteds')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setSpotteds(data)
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Carregando spotteds...</p>
      </div>
    )
  }

  if (spotteds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum spotted aprovado ainda.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Spotteds Aprovados ({spotteds.length})
      </h2>
      <div className="space-y-3">
        {spotteds.map((spotted) => (
          <div
            key={spotted.id}
            className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <p className="text-gray-800 whitespace-pre-wrap">{spotted.message}</p>
            <p className="text-xs text-gray-400 mt-2">
              {formatDate(spotted.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
