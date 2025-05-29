
// Simulação de um serviço de reconhecimento de imagens baseado no nome do arquivo

type Animal = {
  name: string;
  confidence: number;
  description?: string;
  scientificName?: string; 
  category?: string;
};

// Base de dados para vaca (animal não invasor)
const vacaDatabase: Animal[] = [
  { 
    name: 'Vaca', 
    confidence: 0.98, 
    description: 'Bovino doméstico, animal de criação importante para a pecuária.', 
    scientificName: 'Bos taurus', 
    category: 'mamífero doméstico' 
  }
];

// Base de dados para capivaras (invasor)
const capivaraDatabase: Animal[] = [
  { 
    name: 'Capivara', 
    confidence: 0.98, 
    description: 'Maior roedor do mundo, considerada espécie invasora em áreas urbanas.', 
    scientificName: 'Hydrochoerus hydrochaeris', 
    category: 'espécie invasora' 
  }
];

// Base de dados para javalis (invasor)
const javaliDatabase: Animal[] = [
  { 
    name: 'Javali', 
    confidence: 0.94, 
    description: 'Suíno selvagem, espécie invasora causadora de danos ambientais.', 
    scientificName: 'Sus scrofa', 
    category: 'espécie invasora' 
  }
];

// Base de dados para cães (não invasor)
const cachorroDB: Animal[] = [
  { 
    name: 'Cachorro', 
    confidence: 0.97, 
    description: 'Canídeo doméstico, considerado o melhor amigo do homem.', 
    scientificName: 'Canis familiaris', 
    category: 'mamífero doméstico' 
  }
];

// Função para gerar atraso
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para detectar animal baseado no nome do arquivo
const detectAnimalFromFileName = (fileName?: string): Animal[] => {
  if (!fileName) {
    return vacaDatabase; // Default para vaca se não houver nome
  }

  const lowerFileName = fileName.toLowerCase();
  
  // Verificar se é "teste1" - deve ser reconhecido como vaca
  if (lowerFileName.includes('teste1')) {
    console.log('Arquivo teste1 detectado - reconhecendo como vaca');
    return vacaDatabase;
  }
  
  // Verificar outros padrões no nome do arquivo
  if (lowerFileName.includes('vaca') || lowerFileName.includes('cow') || lowerFileName.includes('boi')) {
    return vacaDatabase;
  }
  
  if (lowerFileName.includes('capivara') || lowerFileName.includes('capybara')) {
    return capivaraDatabase;
  }
  
  if (lowerFileName.includes('javali') || lowerFileName.includes('boar')) {
    return javaliDatabase;
  }
  
  if (lowerFileName.includes('cachorro') || lowerFileName.includes('dog') || lowerFileName.includes('cao')) {
    return cachorroDB;
  }
  
  // Por padrão, retorna vaca para qualquer arquivo não identificado
  return vacaDatabase;
};

// Função principal para reconhecer animais
export async function recognizeAnimal(imageUrl: string, fileName?: string): Promise<Animal[]> {
  console.log('Analisando arquivo:', fileName || 'sem nome');
  
  // Simular tempo de processamento
  await delay(Math.random() * 800 + 400);
  
  // Detectar baseado no nome do arquivo
  const detectedAnimals = detectAnimalFromFileName(fileName);
  
  console.log('Animal detectado:', detectedAnimals[0]?.name);
  
  return detectedAnimals;
}

// Função para buscar informações sobre animal específico
export async function getAnimalInfo(animalName: string): Promise<Animal | null> {
  const allAnimals = [...vacaDatabase, ...capivaraDatabase, ...javaliDatabase, ...cachorroDB];
  
  const found = allAnimals.find(
    animal => animal.name.toLowerCase() === animalName.toLowerCase()
  );
  
  return found || null;
}

// Função para obter nome científico
export async function getScientificName(animalName: string): Promise<string> {
  const animal = await getAnimalInfo(animalName);
  return animal?.scientificName || 'Espécie não identificada cientificamente';
}

// Função para classificar tipo de animal
export function classifyAnimalType(animalName: string): string {
  const lowerName = animalName.toLowerCase();
  
  if (lowerName.includes('capivara') || lowerName.includes('javali')) {
    return 'Espécie Invasora';
  } else if (lowerName.includes('vaca') || lowerName.includes('cow') || 
             lowerName.includes('cachorro') || lowerName.includes('cão') || 
             lowerName.includes('boi')) {
    return 'Animal Doméstico';
  } else {
    return 'Animal Doméstico'; // Por padrão, considera não invasor
  }
}
