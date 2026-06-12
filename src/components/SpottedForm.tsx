'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SpottedForm() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) {
      console.error('Supabase não inicializado. Verifique as variáveis de ambiente.')
      setError('Erro de conexão com o banco de dados - Supabase não configurado')
      return
    }
    
    console.log('Supabase conectado, tentando enviar...')
    
    setLoading(true)
    setError('')

    if (message.length < 10 || message.length > 500) {
      setError('A mensagem deve ter entre 10 e 500 caracteres')
      setLoading(false)
      return
    }

    const { error: submitError } = await supabase
      .from('spotteds')
      .insert([{ message, status: 'pending' }])

    if (submitError) {
      setError(`Erro ao enviar: ${submitError.message}`)
      setLoading(false)
      return
    }

    setSuccess(true)
    setMessage('')
    setLoading(false)
    
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Seu Spotted Anônimo
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escreva sua mensagem aqui..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={500}
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>Mínimo: 10 caracteres</span>
          <span>{message.length}/500</span>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {success && (
        <p className="text-green-600 text-sm">
          Spotted enviado com sucesso! Aguarde aprovação.
        </p>
      )}

      <button
        type="submit"
        disabled={loading || message.length < 10}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Enviando...' : 'Enviar Spotted'}
      </button>
    </form>
  )
}
