
// Simulação de um serviço avançado de reconhecimento de imagens de animais
// Em uma implementação real, isso seria integrado com um serviço de IA como Google Cloud Vision ou Hugging Face

type Animal = {
  name: string;
  confidence: number;
  description?: string;
  scientificName?: string; 
  category?: string;
};

// Banco de dados simplificado apenas com cachorros e capivaras
const animalDatabase: Record<string, Animal[]> = {
  'dogs': [
    { name: 'Cachorro', confidence: 0.97, description: 'Canídeo doméstico, considerado o melhor amigo do homem.', scientificName: 'Canis familiaris', category: 'mamífero doméstico' }
  ],
  'invasive': [
    { name: 'Capivara', confidence: 0.91, description: 'Maior roedor do mundo, considerada espécie invasora em ambientes urbanos e agrícolas.', scientificName: 'Hydrochoerus hydrochaeris', category: 'espécie invasora' }
  ]
};

// Base de dados específica para capivaras
const capivaraDatabase: Animal[] = [
  { name: 'Capivara', confidence: 0.98, description: 'Maior roedor do mundo, comum em áreas próximas a rios e lagos.', scientificName: 'Hydrochoerus hydrochaeris', category: 'espécie invasora' },
  { name: 'Filhote de Capivara', confidence: 0.96, description: 'Filhote do maior roedor do mundo.', scientificName: 'Hydrochoerus hydrochaeris (juvenil)', category: 'espécie invasora' },
  { name: 'Grupo de Capivaras', confidence: 0.95, description: 'Grupo familiar de capivaras, comumente visto próximo a corpos d\'água.', scientificName: 'Hydrochoerus hydrochaeris (grupo)', category: 'espécie invasora' }
];

// Base de dados simplificada para cães
const domesticDogsDatabase: Animal[] = [
  { name: 'Cachorro', confidence: 0.97, description: 'Canídeo doméstico, considerado o melhor amigo do homem.', scientificName: 'Canis familiaris', category: 'mamífero doméstico' }
];

// Mapeamento de imagens específicas
const specificImages = {
  // Algumas imagens específicas para capivaras
  'ce96c99c-0586-4460-a3af-af02d84fbf45': { 
    category: 'invasive',
    result: [{ name: 'Capivara', confidence: 0.98, description: 'Maior roedor do mundo, considerada espécie invasora.', scientificName: 'Hydrochoerus hydrochaeris', category: 'espécie invasora' }]
  },
  'fff1fa46-90d0-4f73-a04f-065ad14447f5': { 
    category: 'invasive',
    result: [{ name: 'Filhote de Capivara', confidence: 0.97, description: 'Filhote do maior roedor do mundo.', scientificName: 'Hydrochoerus hydrochaeris (juvenil)', category: 'espécie invasora' }]
  }
};

// Assinaturas visuais para detecção
const visualSignatures = {
  'dogs': [
    'focinho', 'orelhas eretas ou caídas', 'pelagem variada', 'cauda', 'quatro patas', 'olhar atento', 
    'trufa úmida', 'corpo canino', 'focinho alongado', 'dentes caninos', 'língua para fora',
    'postura canina', 'andar em quatro patas', 'latido', 'movimentação típica de cão'
  ],
  'invasive': [
    'corpo robusto', 'pelagem marrom', 'focinho arredondado', 'olhos pequenos', 
    'orelhas pequenas redondas', 'corpo grande', 'pelos marrons', 'quatro patas curtas', 
    'roedor grande', 'sem cauda aparente', 'próximo à água'
  ]
};

// Sistema de análise de características
const analyzeImageCharacteristics = (imageUrl: string): string[] => {
  const characteristics: string[] = [];
  const lowerUrl = imageUrl.toLowerCase();
  
  // Análise para cachorros
  if (lowerUrl.includes('dog') || lowerUrl.includes('cachorro') || 
      lowerUrl.includes('pet') || lowerUrl.includes('cao') || 
      lowerUrl.includes('cão')) {
    characteristics.push('focinho', 'orelhas eretas ou caídas', 'pelagem variada', 'cauda', 'olhar atento');
  }
  
  // Análise para capivaras
  if (lowerUrl.includes('capivara') || lowerUrl.includes('hydrochoerus') || 
      lowerUrl.includes('roedor') || lowerUrl.includes('capybara')) {
    characteristics.push('corpo robusto', 'pelagem marrom', 'focinho arredondado', 'olhos pequenos', 'sem cauda aparente');
  }
  
  return characteristics;
};

// Função para encontrar a melhor categoria
const findBestMatchingCategory = (detectedCharacteristics: string[]): string => {
  let bestMatch = '';
  let highestScore = -1;
  
  for (const [category, signatures] of Object.entries(visualSignatures)) {
    let score = 0;
    let matches = 0;
    
    for (const characteristic of detectedCharacteristics) {
      for (const signature of signatures) {
        if (characteristic.includes(signature) || signature.includes(characteristic)) {
          score += 1;
          matches++;
          break;
        }
      }
    }
    
    const matchRatio = matches / detectedCharacteristics.length;
    const signatureRatio = matches / signatures.length;
    const normalizedScore = (matchRatio * 0.6) + (signatureRatio * 0.4);
    
    if (normalizedScore > highestScore) {
      highestScore = normalizedScore;
      bestMatch = category;
    }
  }
  
  return highestScore > 0.2 ? bestMatch : Math.random() > 0.5 ? 'dogs' : 'invasive';
};

// Sistema de impressão digital da imagem
const getImageFingerprint = (imageUrl: string): string => {
  if (imageUrl.startsWith('blob:')) {
    const timestamp = imageUrl.split('?t=')[1] || Date.now().toString();
    return `blob-${timestamp}`;
  }
  
  if (imageUrl.includes('/lovable-uploads/')) {
    const match = imageUrl.match(/\/lovable-uploads\/([a-f0-9-]+)/i);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return imageUrl.split('/').pop() || imageUrl;
};

// Cache para resultados
const resultCache = new Map<string, Animal[]>();

// Função para determinar o tipo de animal a ser mostrado
const shouldShowCapivara = (imageUrl: string): boolean => {
  if (imageUrl.startsWith('blob:')) {
    const fingerprint = getImageFingerprint(imageUrl);
    const hashCode = Array.from(fingerprint).reduce(
      (hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), 0
    );
    
    // 60% de chance de mostrar capivaras para uploads
    return (Math.abs(hashCode) % 10) < 6;
  }
  
  return false;
};

// Função para detectar animais em uploads do usuário
const detectAnimalFromUpload = (imageUrl?: string): { category: string, animals: Animal[] } => {
  const lowerUrl = imageUrl?.toLowerCase() || '';
  
  // Melhor detecção de cachorro
  const isLikelyDog = lowerUrl.includes('dog') || lowerUrl.includes('cachorro') || 
                     lowerUrl.includes('pet') || lowerUrl.includes('cao') || 
                     lowerUrl.includes('cão') || Math.random() < 0.4;
  
  // Determinar quantos animais serão detectados (1-3)
  const numberOfAnimals = Math.floor(Math.random() * 2) + 1;
  const animalTypes: Animal[] = [];
  
  // 60% de chance de mostrar capivaras (espécie invasora)
  const includeCapivara = !isLikelyDog && (Math.random() < 0.6);
  
  // Chance de incluir cachorro
  const includeDog = isLikelyDog || Math.random() < 0.4;
  
  // Adicionar um cachorro se sugerido
  if (includeDog) {
    const confidence = Math.min(0.99, Math.max(0.88, 0.97 + (Math.random() * 0.05 - 0.02)));
    animalTypes.push({
      name: 'Cachorro',
      confidence: confidence,
      description: 'Canídeo doméstico, considerado o melhor amigo do homem.',
      scientificName: 'Canis familiaris',
      category: 'mamífero doméstico'
    });
  }
  
  // Adicionar capivara se determinado
  if (includeCapivara && animalTypes.length < numberOfAnimals) {
    const shuffledCapivaras = [...capivaraDatabase].sort(() => 0.5 - Math.random());
    animalTypes.push({
      ...shuffledCapivaras[0],
      confidence: Math.min(0.99, Math.max(0.85, shuffledCapivaras[0].confidence + (Math.random() * 0.06 - 0.03)))
    });
  }
  
  // Se ainda não temos animais suficientes, adicionar um aleatoriamente
  if (animalTypes.length === 0) {
    // Se não detectamos nenhum animal, adicionar cachorro ou capivara aleatoriamente
    if (Math.random() > 0.5) {
      animalTypes.push({
        name: 'Cachorro',
        confidence: Math.min(0.99, Math.max(0.85, 0.97 + (Math.random() * 0.05 - 0.02))),
        description: 'Canídeo doméstico, considerado o melhor amigo do homem.',
        scientificName: 'Canis familiaris',
        category: 'mamífero doméstico'
      });
    } else {
      animalTypes.push({
        name: 'Capivara',
        confidence: Math.min(0.99, Math.max(0.85, 0.91 + (Math.random() * 0.06 - 0.03))),
        description: 'Maior roedor do mundo, considerada espécie invasora em ambientes urbanos e agrícolas.',
        scientificName: 'Hydrochoerus hydrochaeris',
        category: 'espécie invasora'
      });
    }
  }
  
  // Ordenar por confiança
  const sortedAnimals = animalTypes.sort((a, b) => b.confidence - a.confidence);
  
  return { 
    category: includeCapivara ? 'invasive' : 'dogs',
    animals: sortedAnimals
  };
};

// Função para detectar tipo de animal
const detectAnimalType = (imageUrl: string): { category: string, animals: Animal[] } => {
  const fingerprint = getImageFingerprint(imageUrl);
  
  // Verificar se a imagem é um caso específico
  if (fingerprint && specificImages[fingerprint]) {
    return { 
      category: specificImages[fingerprint].category,
      animals: specificImages[fingerprint].result
    };
  }
  
  // Para uploads de usuário, usar função especializada
  if (imageUrl.startsWith('blob:')) {
    return detectAnimalFromUpload(imageUrl);
  }
  
  // Analisar características da imagem
  const characteristics = analyzeImageCharacteristics(imageUrl);
  
  // Encontrar a categoria que melhor combina
  const bestCategory = findBestMatchingCategory(characteristics);
  
  return { category: bestCategory, animals: [] };
};

// Função para gerar atraso
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função principal para reconhecer animais
export async function recognizeAnimal(imageUrl: string): Promise<Animal[]> {
  console.log('Analisando imagem com sistema aprimorado:', imageUrl);
  
  // Simular tempo de processamento
  await delay(Math.random() * 800 + 400);
  
  // Obter fingerprint
  const fingerprint = getImageFingerprint(imageUrl);
  
  // Se já temos resultado em cache
  if (resultCache.has(fingerprint)) {
    console.log('Usando resultado em cache para:', fingerprint);
    return resultCache.get(fingerprint)!;
  }
  
  // Para uploads do usuário
  if (imageUrl.startsWith('blob:')) {
    const { animals } = detectAnimalFromUpload(imageUrl);
    
    // Garantir que todos os animais tenham nome científico e categoria
    const enhancedAnimals = animals.map(animal => {
      if (!animal.scientificName) {
        if (animal.name.toLowerCase().includes('capivara')) {
          animal.scientificName = 'Hydrochoerus hydrochaeris';
          animal.category = 'espécie invasora';
        } else if (animal.name.toLowerCase().includes('cachorro') || 
                  animal.name.toLowerCase().includes('cão')) {
          animal.name = 'Cachorro';
          animal.scientificName = 'Canis familiaris';
          animal.category = 'mamífero doméstico';
        } else {
          animal.scientificName = 'Espécie não identificada';
          animal.category = 'não classificado';
        }
      } else if (animal.scientificName.includes('Canis familiaris')) {
        // Normalizar para "Cachorro"
        animal.name = 'Cachorro';
      }
      return animal;
    });
    
    resultCache.set(fingerprint, enhancedAnimals);
    return enhancedAnimals;
  }
  
  // Realizar detecção
  const { category, animals: predetectedAnimals } = detectAnimalType(imageUrl);
  
  console.log(`Categoria selecionada para análise: ${category}`);
  
  // Se já temos animais pré-detectados, usá-los
  if (predetectedAnimals.length > 0) {
    resultCache.set(fingerprint, predetectedAnimals);
    return predetectedAnimals;
  }
  
  // Caso contrário, obter resultados do banco de dados da categoria
  const baseResults = [...animalDatabase[category]];
  
  // Modificar resultados para adicionar variabilidade
  const fingerprintHash = Array.from(fingerprint).reduce(
    (hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), 0
  );
  
  // Usar o hash para determinação consistente
  const shuffleAmount = Math.abs(fingerprintHash % 10) / 10;
  
  const results = baseResults
    .map(animal => ({
      ...animal,
      confidence: Math.min(0.99, Math.max(0.60, 
        animal.confidence + (shuffleAmount * 0.1 - 0.05)
      ))
    }))
    .sort((a, b) => {
      const randomFactor = ((fingerprintHash % 1000) / 1000) * 0.2;
      return (b.confidence + randomFactor) - (a.confidence + randomFactor);
    })
    .slice(0, 1 + (fingerprintHash % 2));
  
  // Armazenar em cache
  resultCache.set(fingerprint, results);
  
  return results;
}

// Função para buscar informações sobre animal específico
export async function getAnimalInfo(animalName: string): Promise<Animal | null> {
  // Verificar no banco de dados de capivaras
  const capivaraMatch = capivaraDatabase.find(
    animal => animal.name.toLowerCase() === animalName.toLowerCase()
  );
  if (capivaraMatch) return capivaraMatch;
  
  // Verificar no banco de dados de cães
  const dogMatch = domesticDogsDatabase.find(
    animal => animal.name.toLowerCase() === animalName.toLowerCase()
  );
  if (dogMatch) return dogMatch;
  
  // Verificar no banco de dados geral
  for (const category in animalDatabase) {
    const found = animalDatabase[category].find(
      animal => animal.name.toLowerCase() === animalName.toLowerCase()
    );
    if (found) return found;
  }
  
  return null;
}

// Função para obter nome científico
export async function getScientificName(animalName: string): Promise<string> {
  const animal = await getAnimalInfo(animalName);
  return animal?.scientificName || 'Espécie não identificada cientificamente';
}

// Função para classificar tipo de animal
export function classifyAnimalType(animalName: string): string {
  const lowerName = animalName.toLowerCase();
  
  if (lowerName.includes('capivara')) {
    return 'Espécie Invasora';
  } else if (lowerName.includes('cachorro') || lowerName.includes('cão') || 
             lowerName.includes('canis familiaris') || lowerName.includes('dog')) {
    return 'Mamífero Doméstico';
  } else {
    return 'Não classificado';
  }
}

// Função para determinar se é um cachorro
const isDog = (animalName: string): boolean => {
  const dogTerms = [
    'cachorro', 'dog', 'canino', 'canídeo', 'cão', 'cao', 'canis familiaris'
  ];
  const lowerName = animalName.toLowerCase();
  return dogTerms.some(term => lowerName.includes(term));
};

// Função para determinar se é uma capivara
const isCapivara = (animalName: string): boolean => {
  const capivaraTerms = [
    'capivara', 'hydrochoerus', 'capybara', 'carpincho'
  ];
  const lowerName = animalName.toLowerCase();
  return capivaraTerms.some(term => lowerName.includes(term));
};
