'use client'

import { useSecurityTracking } from '@/hooks/useSecurityTracking'

// Componente invisível que inicializa o tracking de segurança
// Deve ser incluído no layout para funcionar em todas as páginas
export default function SecurityTracker() {
  // O hook já inicializa automaticamente no mount
  useSecurityTracking()
  
  // Não renderiza nada
  return null
}
