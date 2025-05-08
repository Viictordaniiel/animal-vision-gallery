
// Simulação de um serviço de reconhecimento de imagens de animais
// Em uma implementação real, isso seria integrado com um serviço de IA como Google Cloud Vision ou Hugging Face

type Animal = {
  name: string;
  confidence: number;
  description?: string;
};

// Banco de dados expandido de animais para reconhecimento
const animalDatabase: Record<string, Animal[]> = {
  'farm': [
    { name: 'Vaca', confidence: 0.92, description: 'Bovino doméstico utilizado para produção de leite e carne.' },
    { name: 'Cavalo', confidence: 0.87, description: 'Equino utilizado para transporte e trabalho rural.' },
    { name: 'Galinha', confidence: 0.95, description: 'Ave doméstica criada para produção de ovos e carne.' },
    { name: 'Porco', confidence: 0.89, description: 'Suíno doméstico criado para produção de carne.' },
    { name: 'Ovelha', confidence: 0.86, description: 'Mamífero ruminante criado para produção de lã e carne.' }
  ],
  'forest': [
    { name: 'Veado', confidence: 0.89, description: 'Mamífero ruminante da família dos cervídeos.' },
    { name: 'Lobo', confidence: 0.78, description: 'Canídeo selvagem que vive em matilhas.' },
    { name: 'Raposa', confidence: 0.82, description: 'Pequeno mamífero carnívoro da família dos canídeos.' },
    { name: 'Urso', confidence: 0.91, description: 'Grande mamífero carnívoro da família dos ursídeos.' },
    { name: 'Alce', confidence: 0.85, description: 'Grande mamífero da família dos cervídeos.' }
  ],
  'pets': [
    { name: 'Cachorro', confidence: 0.97, description: 'Canídeo doméstico, considerado o melhor amigo do homem.' },
    { name: 'Gato', confidence: 0.98, description: 'Felino doméstico popular como animal de estimação.' },
    { name: 'Coelho', confidence: 0.91, description: 'Pequeno mamífero da família dos leporídeos.' },
    { name: 'Hamster', confidence: 0.93, description: 'Pequeno roedor mantido como animal de estimação.' },
    { name: 'Papagaio', confidence: 0.88, description: 'Ave colorida conhecida por sua capacidade de imitar sons.' }
  ],
  'wild_pigs': [
    { name: 'Javali', confidence: 0.95, description: 'Sus scrofa, mamífero selvagem da família Suidae, causador de danos em plantações.' },
    { name: 'Javali Filhote', confidence: 0.92, description: 'Filhote de javali, reconhecível pelas listras no corpo quando jovem.' },
    { name: 'Grupo de Javalis', confidence: 0.89, description: 'Vara de javalis, grupo familiar que pode causar grandes danos em áreas agrícolas.' },
    { name: 'Porco-do-mato', confidence: 0.87, description: 'Espécie de suíno selvagem comum em regiões florestais e agrícolas do Brasil.' }
  ],
  'birds': [
    { name: 'Gavião', confidence: 0.88, description: 'Ave de rapina com excelente visão e garras afiadas.' },
    { name: 'Coruja', confidence: 0.91, description: 'Ave noturna conhecida por sua capacidade de girar a cabeça.' },
    { name: 'Tucano', confidence: 0.93, description: 'Ave tropical com bico grande e colorido.' },
    { name: 'Beija-flor', confidence: 0.95, description: 'Pequena ave conhecida por bater as asas rapidamente.' }
  ],
  'reptiles': [
    { name: 'Jacaré', confidence: 0.89, description: 'Réptil semiaquático da ordem dos crocodilianos.' },
    { name: 'Iguana', confidence: 0.86, description: 'Réptil herbívoro encontrado em regiões tropicais.' },
    { name: 'Cobra', confidence: 0.92, description: 'Réptil sem patas da subordem Serpentes.' },
    { name: 'Tartaruga', confidence: 0.94, description: 'Réptil caracterizado por uma carapaça protetora.' }
  ]
};

// Mapeamento de imagens de treinamento
const trainingImages = {
  javali_adulto: '/lovable-uploads/ce96c99c-0586-4460-a3af-af02d84fbf45.png',
  javali_filhote: '/lovable-uploads/fff1fa46-90d0-4f73-a04f-065ad14447f5.png',
  javali_cerca: '/lovable-uploads/20897a2e-76e4-4906-92b0-a798999f5c45.png',
  javali_grupo: '/lovable-uploads/c26c1704-463e-4f86-a15c-56901b7ed7ea.png',
  // Adicionando outras referências para as imagens enviadas
  animais_diversos: {
    'ab9e1f1e-55fd-47f3-b7b2-7d0e99c4669a': 'wild_pigs',
    'f677b28b-4909-4fb7-9c21-509d1ba8522b': 'forest',
    'ce96c99c-0586-4460-a3af-af02d84fbf45': 'wild_pigs',
    'fff1fa46-90d0-4f73-a04f-065ad14447f5': 'wild_pigs',
    '20897a2e-76e4-4906-92b0-a798999f5c45': 'wild_pigs',
    'c26c1704-463e-4f86-a15c-56901b7ed7ea': 'wild_pigs'
  }
};

// Função auxiliar para gerar um atraso aleatório simulando processamento
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cache para evitar resultados idênticos para a mesma sessão
const resultCache = new Map<string, string>();

// Função para detectar se a imagem contém javalis com base no conteúdo da URL
const detectWildPig = (imageUrl: string): boolean => {
  // Em um ambiente real, isso seria feito por um modelo de ML
  const pigKeywords = ['javali', 'pig', 'wild', 'boar', 'suino', 'porco'];
  
  // Verificar se é uma das imagens de treinamento específicas de javali
  for (const [key, url] of Object.entries(trainingImages)) {
    if (typeof url === 'string' && key.includes('javali') && imageUrl.includes(url)) {
      return true;
    }
  }
  
  // Verificar se é uma das imagens específicas classificadas como javali
  if (imageUrl.includes('/lovable-uploads/')) {
    const imageId = imageUrl.split('/').pop()?.split('.')[0];
    if (imageId && trainingImages.animais_diversos[imageId] === 'wild_pigs') {
      return true;
    }
  }
  
  return pigKeywords.some(keyword => imageUrl.toLowerCase().includes(keyword));
};

// Função para gerar uma impressão digital única para cada imagem
const getImageFingerprint = (imageUrl: string): string => {
  // Para URLs blob, usar timestamp ou ID gerado aleatoriamente para simular uma impressão única
  if (imageUrl.startsWith('blob:')) {
    const timestamp = imageUrl.split('?t=')[1] || Date.now().toString();
    return `blob-${timestamp}`;
  }
  
  // Para URLs normais, usar o nome do arquivo ou caminho
  return imageUrl.split('/').pop() || imageUrl;
};

// Função para selecionar uma categoria baseada em características da imagem e histórico
const selectAnimalCategory = (imageUrl: string): string => {
  const fingerprint = getImageFingerprint(imageUrl);
  
  // Verificar se temos uma categoria já definida para esta imagem
  if (imageUrl.includes('/lovable-uploads/')) {
    const imageId = imageUrl.split('/').pop()?.split('.')[0];
    if (imageId && trainingImages.animais_diversos[imageId]) {
      return trainingImages.animais_diversos[imageId];
    }
  }
  
  // Verificar se já temos um resultado em cache para esta imagem
  if (resultCache.has(fingerprint)) {
    return resultCache.get(fingerprint)!;
  }
  
  // Para imagens de javalis, priorizar esta categoria
  if (detectWildPig(imageUrl)) {
    resultCache.set(fingerprint, 'wild_pigs');
    return 'wild_pigs';
  }
  
  // Distribuição ponderada das categorias para resultados mais realistas
  const categories = Object.keys(animalDatabase);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  // Armazenar em cache para manter consistência na sessão
  resultCache.set(fingerprint, randomCategory);
  return randomCategory;
};

// Função para analisar a imagem e retornar resultados simulados
export async function recognizeAnimal(imageUrl: string): Promise<Animal[]> {
  console.log('Analisando imagem:', imageUrl);
  
  // Simulação de processamento
  await delay(Math.random() * 1000 + 500); // Espera entre 0.5-1.5 segundos
  
  // Determinar a categoria mais apropriada para esta imagem
  const category = selectAnimalCategory(imageUrl);
  console.log(`Categoria selecionada para análise: ${category}`);
  
  // Obter resultados do banco de dados
  const results = [...animalDatabase[category]];
  
  // Adicionar alguma variabilidade aos resultados
  const shuffledResults = results
    // Ajustar a confiança com uma pequena variação para parecer mais realista
    .map(animal => ({
      ...animal,
      confidence: Math.min(0.99, Math.max(0.5, animal.confidence + (Math.random() * 0.1 - 0.05)))
    }))
    // Embaralhar para não retornar sempre na mesma ordem
    .sort(() => Math.random() - 0.5)
    // Limitar a quantidade de resultados
    .slice(0, Math.floor(Math.random() * 2) + 2); // 2-3 resultados
  
  return shuffledResults;
}

// Função para buscar informações sobre um animal específico
export async function getAnimalInfo(animalName: string): Promise<Animal | null> {
  // Procura em todas as categorias
  for (const category in animalDatabase) {
    const found = animalDatabase[category].find(
      animal => animal.name.toLowerCase() === animalName.toLowerCase()
    );
    if (found) return found;
  }
  return null;
}
