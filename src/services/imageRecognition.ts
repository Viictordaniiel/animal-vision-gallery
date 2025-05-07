
// Simulação de um serviço de reconhecimento de imagens de animais
// Em uma implementação real, isso seria integrado com um serviço de IA como Google Cloud Vision ou Hugging Face

type Animal = {
  name: string;
  confidence: number;
  description?: string;
};

// Simulação de uma base de dados de animais para reconhecimento
const animalDatabase: Record<string, Animal[]> = {
  'farm': [
    { name: 'Vaca', confidence: 0.92, description: 'Bovino doméstico utilizado para produção de leite e carne.' },
    { name: 'Cavalo', confidence: 0.87, description: 'Equino utilizado para transporte e trabalho rural.' },
    { name: 'Galinha', confidence: 0.95, description: 'Ave doméstica criada para produção de ovos e carne.' }
  ],
  'forest': [
    { name: 'Veado', confidence: 0.89, description: 'Mamífero ruminante da família dos cervídeos.' },
    { name: 'Lobo', confidence: 0.78, description: 'Canídeo selvagem que vive em matilhas.' },
    { name: 'Raposa', confidence: 0.82, description: 'Pequeno mamífero carnívoro da família dos canídeos.' }
  ],
  'pets': [
    { name: 'Cachorro', confidence: 0.97, description: 'Canídeo doméstico, considerado o melhor amigo do homem.' },
    { name: 'Gato', confidence: 0.98, description: 'Felino doméstico popular como animal de estimação.' },
    { name: 'Coelho', confidence: 0.91, description: 'Pequeno mamífero da família dos leporídeos.' }
  ],
  'wild_pigs': [
    { name: 'Javali', confidence: 0.95, description: 'Sus scrofa, mamífero selvagem da família Suidae, causador de danos em plantações.' },
    { name: 'Javali Filhote', confidence: 0.92, description: 'Filhote de javali, reconhecível pelas listras no corpo quando jovem.' },
    { name: 'Grupo de Javalis', confidence: 0.89, description: 'Vara de javalis, grupo familiar que pode causar grandes danos em áreas agrícolas.' },
    { name: 'Porco-do-mato', confidence: 0.87, description: 'Espécie de suíno selvagem comum em regiões florestais e agrícolas do Brasil.' }
  ]
};

// Imagens de treinamento (referências às imagens enviadas)
const trainingImages = {
  javali_adulto: '/lovable-uploads/ce96c99c-0586-4460-a3af-af02d84fbf45.png',
  javali_filhote: '/lovable-uploads/fff1fa46-90d0-4f73-a04f-065ad14447f5.png',
  javali_cerca: '/lovable-uploads/20897a2e-76e4-4906-92b0-a798999f5c45.png',
  javali_grupo: '/lovable-uploads/c26c1704-463e-4f86-a15c-56901b7ed7ea.png'
};

// Função auxiliar para gerar um atraso aleatório simulando processamento
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para detectar se a imagem contém javalis com base no conteúdo da URL
const detectWildPig = (imageUrl: string): boolean => {
  // Em um ambiente real, isso seria feito por um modelo de ML
  // Aqui estamos simulando com base em palavras na URL
  const pigKeywords = ['javali', 'pig', 'wild', 'boar', 'suino', 'porco'];
  return pigKeywords.some(keyword => imageUrl.toLowerCase().includes(keyword));
};

// Função para analisar a imagem e retornar resultados simulados
export async function recognizeAnimal(imageUrl: string): Promise<Animal[]> {
  console.log('Analisando imagem:', imageUrl);
  
  // Simulação de processamento
  await delay(Math.random() * 2000 + 1000); // Espera entre 1-3 segundos
  
  // Lógica para determinar categoria baseada em URL/nome da imagem
  let category = 'farm';
  
  // Verificar se é uma das imagens de treinamento de javali
  const isTrainingImage = Object.values(trainingImages).some(
    trainingUrl => imageUrl.includes(trainingUrl)
  );
  
  if (isTrainingImage || detectWildPig(imageUrl)) {
    category = 'wild_pigs';
    console.log('Javali detectado na imagem!');
  } else if (imageUrl.includes('forest') || imageUrl.includes('wild')) {
    category = 'forest';
  } else if (imageUrl.includes('pet') || imageUrl.includes('dog') || imageUrl.includes('cat')) {
    category = 'pets';
  }
  
  // Retorna resultados simulados baseados na categoria
  return animalDatabase[category];
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
