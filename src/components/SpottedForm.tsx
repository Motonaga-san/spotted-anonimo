'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { contemPalavraProibida } from '@/lib/moderacao'

interface SpottedFormProps {
  onSpottedEnviado?: () => void
}

export default function SpottedForm({ onSpottedEnviado }: SpottedFormProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Verifica palavras proibidas em tempo real
  useEffect(() => {
    if (message.length >= 10) {
      const resultado = contemPalavraProibida(message)
      if (resultado.contem) {
        setWarning(`Atenção: Seu spotted contém termos que podem violar nossas diretrizes (${resultado.categorias.join(', ')}). Spotteds ofensivos serão rejeitados.`)
      } else {
        setWarning('')
      }
    } else {
      setWarning('')
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) {
      setError('Erro de conexão com o banco de dados')
      return
    }
    
    setLoading(true)
    setError('')

    if (message.length < 10 || message.length > 500) {
      setError('A mensagem deve ter entre 10 e 500 caracteres')
      setLoading(false)
      return
    }

    // Verificação final antes de enviar
    const resultado = contemPalavraProibida(message)
    if (resultado.contem) {
      setError('Seu spotted contém termos proibidos e não pode ser enviado.')
      setLoading(false)
      return
    }

    const { error: submitError } = await supabase
      .from('spotteds')
      .insert([{ 
        message, 
        status: 'pending',
        likes: 0
      }])

    if (submitError) {
      setError('Erro ao enviar. Tente novamente.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setMessage('')
    setShowPreview(false)
    setLoading(false)
    onSpottedEnviado?.()
    
    setTimeout(() => setSuccess(false), 4000)
  }

  const caracteresRestantes = 500 - message.length
  const progresso = (message.length / 500) * 100

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header do form */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Envie seu Spotted</h2>
            <p className="text-sm text-gray-500">100% anônimo e seguro</p>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva sua mensagem anonimamente..."
            className="w-full h-36 p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-200 focus:border-pink-400 resize-none transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-700 placeholder-gray-400"
            maxLength={500}
          />
          
          {/* Contador visual */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className={`text-xs font-medium ${caracteresRestantes < 50 ? 'text-orange-500' : caracteresRestantes < 100 ? 'text-yellow-500' : 'text-gray-400'}`}>
              {message.length}/500
            </span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${
              progresso > 90 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
              progresso > 70 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
              'bg-gradient-to-r from-pink-500 to-purple-500'
            }`}
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Warning de palavras proibidas */}
        {warning && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{warning}</span>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-shake">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Sucesso */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 animate-fade-in">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Spotted enviado! Aguarde aprovação dos moderadores.</span>
          </div>
        )}

        {/* Botão Preview */}
        {message.length >= 10 && !showPreview && (
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="w-full py-3 px-4 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Visualizar antes de enviar
          </button>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</span>
              <button 
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
            </div>
          </div>
        )}

        {/* Botão Enviar */}
        <button
          type="submit"
          disabled={loading || message.length < 10}
          className="w-full py-4 px-4 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enviando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Enviar Spotted
            </span>
          )}
        </button>

        {/* Dica */}
        <p className="text-xs text-center text-gray-400">
          Seu spotted é anônimo e será revisado antes de ser publicado.
        </p>
      </form>
    </div>
  )
}
