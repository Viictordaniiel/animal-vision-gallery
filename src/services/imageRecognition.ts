
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
  ]
};

// Função auxiliar para gerar um atraso aleatório simulando processamento
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para analisar a imagem e retornar resultados simulados
export async function recognizeAnimal(imageUrl: string): Promise<Animal[]> {
  console.log('Analisando imagem:', imageUrl);
  
  // Simulação de processamento
  await delay(Math.random() * 2000 + 1000); // Espera entre 1-3 segundos
  
  // Lógica simplificada para determinar categoria baseada em URL/nome da imagem
  let category = 'farm';
  if (imageUrl.includes('forest') || imageUrl.includes('wild')) {
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
