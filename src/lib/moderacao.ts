// Lista de palavras proibidas organizadas por categoria
export const PALAVRAS_PROIBIDAS = {
  // Racismo
  racismo: [
    'mongoloide', 'mongolóide', 'negro de merda', 'negro de m...', 
    'preto de merda', 'macaco', 'whitexican', 'negão',
    'crioulo', 'preto nojento', 'branco privilege'
  ],
  
  // Homofobia
  homofobia: [
    'bicha', 'boiola', 'viado', 'gayzinho', 'sapatão', 
    'sapatona', 'traveco', 'travesti de merda', 'heteroflex'
  ],
  
  // Xenofobia
  xenofobia: [
    'nordestino de merda', 'paraíba', 'arigó', 'retardado',
    'japa', 'japoneis', 'chink', 'gringo sujo'
  ],
  
  // Sexismo/Misoginia
  sexismo: [
    'vadia', 'puta', 'piranha', 'vagabunda', 'novinha', 
    'gostosa pra caralho', 'mulherada', 'feminazi'
  ],
  
  // Capacitismo
  capacitismo: [
    'retardado', 'mongol', 'deficiente mental', 'aleijado',
    'surdo mudo', 'cego de merda', 'autista de'
  ],
  
  // Violência
  violencia: [
    'mata ele', 'mata ela', 'vou te matar', 'se mata', 'suicida',
    'estupro', 'estuprador', 'pedófilo', 'pedofilia'
  ],
  
  // Discriminação religiosa
  religiao: [
    'crente de merda', 'católico de merda', 'judeu de merda',
    'muçulmano terrorista', 'macumbeiro'
  ],
  
  // Outros termos tóxicos
  toxicos: [
    'suicidio', 'suicídio', 'se mata', 'se joga', 'cancer',
    'câncer de', 'aids', 'hiv positivo kkk'
  ]
}

// Junta todas as palavras em uma lista única
export const TODAS_PALAVRAS_PROIBIDAS: string[] = Object.values(PALAVRAS_PROIBIDAS).flat()

// Função para verificar se o texto contém palavras proibidas
export function contemPalavraProibida(texto: string): { 
  contem: boolean
  palavrasEncontradas: string[]
  categorias: string[]
} {
  const textoLower = texto.toLowerCase()
  const palavrasEncontradas: string[] = []
  const categorias: string[] = []
  
  for (const [categoria, palavras] of Object.entries(PALAVRAS_PROIBIDAS)) {
    for (const palavra of palavras) {
      if (textoLower.includes(palavra.toLowerCase())) {
        palavrasEncontradas.push(palavra)
        if (!categorias.includes(categoria)) {
          categorias.push(categoria)
        }
      }
    }
  }
  
  return {
    contem: palavrasEncontradas.length > 0,
    palavrasEncontradas,
    categorias
  }
}

// Função para censurar palavras (substitui por asteriscos)
export function censurarTexto(texto: string): string {
  let textoCensurado = texto
  
  for (const palavra of TODAS_PALAVRAS_PROIBIDAS) {
    const regex = new RegExp(palavra, 'gi')
    textoCensurado = textoCensurado.replace(regex, '*'.repeat(palavra.length))
  }
  
  return textoCensurado
}
