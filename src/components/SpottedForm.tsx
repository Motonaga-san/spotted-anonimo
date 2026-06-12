'use client'
 
import { useState, useRef, useEffect } from 'react'
import { supabase, generateFingerprint, getVisitorInfo } from '@/lib/supabase'
import { contemPalavraProibida, formatTextHtml } from '@/lib/moderacao'
 
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const applyFormat = (format: 'bold' | 'italic') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = message.substring(start, end)
    
    if (selectedText) {
      const marker = format === 'bold' ? '**' : '*'
      const newText = message.substring(0, start) + marker + selectedText + marker + message.substring(end)
      setMessage(newText)
    }
  }

  useEffect(() => {
    if (message.length >= 10) {
      const resultado = contemPalavraProibida(message)
      if (resultado.contem) {
        setWarning(`Termos detectados: ${resultado.categorias.join(', ')}. Spotteds ofensivos podem ser removidos.`)
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

    if (message.length < 10 || message.length > 2000) {
      setError('A mensagem deve ter entre 10 e 2000 caracteres')
      setLoading(false)
      return
    }

    const resultado = contemPalavraProibida(message)
    if (resultado.severidade === 'alta') {
      setError('Seu spotted contém termos proibidos e não pode ser enviado.')
      setLoading(false)
      return
    }

    const fingerprint = generateFingerprint()
    const messageHtml = formatTextHtml(message)
    const visitorInfo = await getVisitorInfo()

    const { error: submitError } = await supabase
      .from('spotteds')
      .insert([{ 
        message, 
        message_html: messageHtml,
        status: 'approved',
        likes: 0,
        views: 0,
        reports_count: 0,
        author_fingerprint: fingerprint,
        author_ip: visitorInfo.ip,
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

  const caracteresRestantes = 2000 - message.length
  const progresso = Math.min((message.length / 2000) * 100, 100)

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header do form */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Envie seu Spotted</h2>
            <p className="text-sm text-secondary">100% anônimo e seguro</p>
          </div>
        </div>

        {/* Barra de formatação */}
        <div className="flex gap-2 p-2 card-theme rounded-xl">
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            className="p-2 hover:bg-input rounded-lg transition-colors text-muted hover:text-primary"
            title="Negrito"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className="p-2 hover:bg-input rounded-lg transition-colors text-muted hover:text-primary italic"
            title="Itálico"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m0 0h4m-4 0" />
            </svg>
          </button>
          <span className="text-muted mx-2">|</span>
          <span className="text-xs text-muted flex items-center">
            Use **negrito** e *itálico*
          </span>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva sua mensagem anonimamente...

Dica: Use **texto** para negrito e *texto* para itálico"
            className="w-full h-40 p-4 input-theme rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 resize-none transition-all duration-200"
            maxLength={2000}
          />
          
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className={`text-xs font-medium ${caracteresRestantes < 200 ? 'text-orange-400' : caracteresRestantes < 500 ? 'text-yellow-400' : 'text-muted'}`}>
              {message.length}/2000
            </span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-1.5 bg-input rounded-full overflow-hidden border border-border">
          <div 
            className={`h-full transition-all duration-300 rounded-full ${
              progresso > 90 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
              progresso > 70 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
              'bg-gradient-to-r from-pink-500 to-purple-500'
            }`}
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Warning */}
        {warning && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-sm">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{warning}</span>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Sucesso */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 animate-fade-in">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Spotted enviado com sucesso!</span>
          </div>
        )}

        {/* Preview */}
        {showPreview && message.length >= 10 && (
          <div className="p-4 card-theme rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted uppercase tracking-wide">Preview</span>
              <button 
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-muted hover:text-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 bg-input rounded-lg">
              <p className="text-primary whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatTextHtml(message) }} />
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            disabled={message.length < 10}
            className="flex-1 py-3 px-4 card-theme text-secondary font-medium rounded-xl hover:opacity-80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
          
          <button
            type="submit"
            disabled={loading || message.length < 10}
            className="flex-1 py-4 px-4 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
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
        </div>

        <p className="text-xs text-center text-muted">
          Posts são publicados automaticamente. Conteúdo ofensivo pode ser removido.
        </p>
      </form>
    </div>
  )
}
