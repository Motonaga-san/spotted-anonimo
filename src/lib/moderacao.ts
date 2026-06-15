// Lista de palavras proibidas organizadas por categoria
export const PALAVRAS_PROIBIDAS = {
  // Racismo
  racismo: [
    'mongoloide', 'mongolóide', 'negro de merda', 'preto de merda', 
    'macaco', 'whitexican', 'negão', 'crioulo', 'preto nojento',
    'branco privilege', 'branquelo', 'negro fedendo', 'racista kkk'
  ],
  
  // Homofobia
  homofobia: [
    'bicha', 'boiola', 'viado', 'gayzinho', 'sapatão', 
    'sapatona', 'traveco', 'travesti de merda', 'heteroflex',
    'gay de armário', 'viadinho'
  ],
  
  // Xenofobia
  xenofobia: [
    'nordestino de merda', 'paraíba', 'arigó', 'japa', 
    'japoneis', 'chink', 'gringo sujo', 'boliviano de'
  ],
  
  // Sexismo/Misoginia
  sexismo: [
    'vadia', 'puta', 'piranha', 'vagabunda', 'novinha', 
    'gostosa pra caralho', 'mulherada', 'feminazi', 'machista'
  ],
  
  // Capacitismo
  capacitismo: [
    'retardado', 'mongol', 'deficiente mental', 'aleijado',
    'surdo mudo', 'cego de merda', 'autista de', 'retard'
  ],
  
  // Violência
  violencia: [
    'mata ele', 'mata ela', 'vou te matar', 'se mata', 'suicida',
    'estupro', 'estuprador', 'pedófilo', 'pedofilia', 'morte'
  ],
  
  // Discriminação religiosa
  religiao: [
    'crente de merda', 'católico de merda', 'judeu de merda',
    'muçulmano terrorista', 'macumbeiro', 'satanista'
  ],
  
  // Conteúdo sexual explícito
  sexual: [
    'pornô', 'porno', 'sexo com', 'transar com', 'nudes de',
    'só de calcinha', 'pelada'
  ],

  // Outros termos tóxicos
  toxicos: [
    'suicidio', 'suicídio', 'se mata', 'se joga', 'cancer',
    'câncer de', 'aids', 'hiv positivo kkk', 'kkkj', 'cancer na'
  ]
}

// Junta todas as palavras em uma lista única
export const TODAS_PALAVRAS_PROIBIDAS: string[] = Object.values(PALAVRAS_PROIBIDAS).flat()

// Razões de denúncia
export const REPORT_REASONS = [
  { value: 'preconceito', label: 'Preconceito ou discriminação' },
  { value: 'ofensa', label: 'Ofensa pessoal' },
  { value: 'assedio', label: 'Assédio ou ameaça' },
  { value: 'conteudo_improprio', label: 'Conteúdo impróprio' },
  { value: 'spam', label: 'Spam' },
  { value: 'outro', label: 'Outro' },
]

// Função para verificar se o texto contém palavras proibidas
export function contemPalavraProibida(texto: string): { 
  contem: boolean
  palavrasEncontradas: string[]
  categorias: string[]
  severidade: 'baixa' | 'media' | 'alta'
} {
  const textoLower = texto.toLowerCase()
  const palavrasEncontradas: string[] = []
  const categorias: string[] = []
  
  // Categorias de alta severidade
  const altaSeveridade = ['violencia', 'racismo', 'pedofilia']
  
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
  
  const severidade = categorias.some(c => altaSeveridade.includes(c)) 
    ? 'alta' 
    : palavrasEncontradas.length > 3 
      ? 'media' 
      : 'baixa'
  
  return {
    contem: palavrasEncontradas.length > 0,
    palavrasEncontradas,
    categorias,
    severidade
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

// Sanitização simples sem dependência de DOM (funciona em SSR)
function simpleSanitize(html: string): string {
  return html
    // Remove tags de script
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove atributos perigosos
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    // Remove tags não permitidas, exceto as seguras
    .replace(/<(?!\/?(strong|em|br|p)\s*\/?>)[^>]+>/gi, '')
}

// Formata texto com markdown básico e sanitiza para prevenir XSS
export function formatTextHtml(text: string): string {
  // Primeiro converte markdown para HTML
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
  
  // Sanitiza o HTML
  return simpleSanitize(html)
}

// Sanitiza HTML já formatado (para conteúdo vindo do banco)
export function sanitizeHtml(html: string): string {
  return simpleSanitize(html)
}
