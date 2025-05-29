// Simulação de um serviço de reconhecimento de imagens baseado no nome do arquivo

type Animal = {
  name: string;
  confidence: number;
  description?: string;
  scientificName?: string; 
  category?: string;
  habitat?: string;
  diet?: string;
  threats?: string;
  conservation?: string;
};

// Base de dados para bovinos (animais não invasores)
const bovinosDatabase: Animal[] = [
  { 
    name: 'Vaca', 
    confidence: 0.98, 
    description: 'Bovino doméstico, animal de criação importante para a pecuária.', 
    scientificName: 'Bos taurus', 
    category: 'mamífero doméstico',
    habitat: 'Pastos, fazendas e áreas rurais',
    diet: 'Herbívoro - capim, feno, ração',
    threats: 'Doenças, predadores naturais',
    conservation: 'Não ameaçado - domesticado'
  },
  { 
    name: 'Boi', 
    confidence: 0.92, 
    description: 'Bovino macho adulto, usado principalmente para trabalho e carne.', 
    scientificName: 'Bos taurus', 
    category: 'mamífero doméstico',
    habitat: 'Pastos, fazendas e áreas rurais',
    diet: 'Herbívoro - capim, feno, ração',
    threats: 'Doenças, predadores naturais',
    conservation: 'Não ameaçado - domesticado'
  },
  { 
    name: 'Búfalo', 
    confidence: 0.78, 
    description: 'Bovino de origem asiática, robusto e resistente.', 
    scientificName: 'Bubalus bubalis', 
    category: 'mamífero doméstico',
    habitat: 'Áreas alagadas, pastos úmidos',
    diet: 'Herbívoro - plantas aquáticas, capim',
    threats: 'Doenças, predadores naturais',
    conservation: 'Não ameaçado - domesticado'
  }
];

// Base de dados para capivaras e roedores (invasores/nativos)
const roedoresDatabase: Animal[] = [
  { 
    name: 'Capivara', 
    confidence: 0.98, 
    description: 'Maior roedor do mundo, considerada espécie invasora em áreas urbanas.', 
    scientificName: 'Hydrochoerus hydrochaeris', 
    category: 'espécie invasora',
    habitat: 'Próximo a corpos d\'água, áreas alagadas',
    diet: 'Herbívoro - plantas aquáticas, capim',
    threats: 'Caça, perda de habitat, atropelamentos',
    conservation: 'Preocupação menor, mas invasora em centros urbanos'
  },
  { 
    name: 'Paca', 
    confidence: 0.85, 
    description: 'Roedor de grande porte, similar à capivara mas menor.', 
    scientificName: 'Cuniculus paca', 
    category: 'fauna nativa',
    habitat: 'Florestas próximas a água, matas ciliares',
    diet: 'Herbívoro - frutos, sementes, brotos',
    threats: 'Caça, desmatamento',
    conservation: 'Vulnerável em algumas regiões'
  },
  { 
    name: 'Cutia', 
    confidence: 0.72, 
    description: 'Roedor nativo brasileiro, importante dispersor de sementes.', 
    scientificName: 'Dasyprocta spp.', 
    category: 'fauna nativa',
    habitat: 'Florestas tropicais, cerrado',
    diet: 'Herbívoro - frutos, sementes, brotos',
    threats: 'Desmatamento, caça predatória',
    conservation: 'Algumas espécies vulneráveis'
  }
];

// Base de dados para suínos (invasores/domésticos)
const suinosDatabase: Animal[] = [
  { 
    name: 'Javali', 
    confidence: 0.94, 
    description: 'Suíno selvagem, espécie invasora causadora de danos ambientais.', 
    scientificName: 'Sus scrofa', 
    category: 'espécie invasora',
    habitat: 'Florestas, campos, áreas agrícolas',
    diet: 'Onívoro - raízes, frutos, pequenos animais',
    threats: 'Controle populacional, caça regulamentada',
    conservation: 'Espécie invasora - manejo necessário'
  },
  { 
    name: 'Porco-do-mato', 
    confidence: 0.89, 
    description: 'Suíno nativo, também conhecido como cateto ou queixada.', 
    scientificName: 'Pecari tajacu', 
    category: 'fauna nativa',
    habitat: 'Florestas tropicais, cerrado, caatinga',
    diet: 'Onívoro - frutos, raízes, pequenos animais',
    threats: 'Desmatamento, caça, fragmentação de habitat',
    conservation: 'Vulnerável em algumas regiões'
  },
  { 
    name: 'Porco Doméstico', 
    confidence: 0.76, 
    description: 'Suíno doméstico criado para consumo.', 
    scientificName: 'Sus scrofa domesticus', 
    category: 'mamífero doméstico',
    habitat: 'Fazendas, chiqueiros, áreas rurais',
    diet: 'Onívoro - ração, restos de comida',
    threats: 'Doenças, predadores',
    conservation: 'Não ameaçado - domesticado'
  }
];

// Base de dados para canídeos (domésticos/nativos)
const canideosDatabase: Animal[] = [
  { 
    name: 'Cachorro', 
    confidence: 0.97, 
    description: 'Canídeo doméstico, considerado o melhor amigo do homem.', 
    scientificName: 'Canis familiaris', 
    category: 'mamífero doméstico',
    habitat: 'Residências, fazendas, áreas urbanas',
    diet: 'Onívoro - ração, carne, vegetais',
    threats: 'Doenças, acidentes, maus-tratos',
    conservation: 'Não ameaçado - domesticado'
  },
  { 
    name: 'Lobo-guará', 
    confidence: 0.91, 
    description: 'Maior canídeo da América do Sul, símbolo do cerrado brasileiro.', 
    scientificName: 'Chrysocyon brachyurus', 
    category: 'fauna nativa',
    habitat: 'Cerrado, campos, áreas abertas',
    diet: 'Onívoro - pequenos mamíferos, frutos, lobeira',
    threats: 'Atropelamentos, perda de habitat, doenças',
    conservation: 'Vulnerável - necessita proteção'
  },
  { 
    name: 'Cachorro-do-mato', 
    confidence: 0.83, 
    description: 'Canídeo nativo brasileiro, menor que o lobo-guará.', 
    scientificName: 'Cerdocyon thous', 
    category: 'fauna nativa',
    habitat: 'Cerrado, caatinga, campos',
    diet: 'Onívoro - pequenos mamíferos, frutos, insetos',
    threats: 'Atropelamentos, perda de habitat',
    conservation: 'Preocupação menor'
  }
];

// Base de dados para felinos (nativos)
const felinosDatabase: Animal[] = [
  { 
    name: 'Onça-pintada', 
    confidence: 0.95, 
    description: 'Maior felino das Américas, predador apex dos ecossistemas brasileiros.', 
    scientificName: 'Panthera onca', 
    category: 'fauna nativa',
    habitat: 'Pantanal, Amazônia, Mata Atlântica',
    diet: 'Carnívoro - jacarés, peixes, mamíferos',
    threats: 'Desmatamento, caça, conflitos com pecuária',
    conservation: 'Vulnerável - proteção crítica'
  },
  { 
    name: 'Jaguatirica', 
    confidence: 0.88, 
    description: 'Felino de médio porte, excelente caçador noturno.', 
    scientificName: 'Leopardus pardalis', 
    category: 'fauna nativa',
    habitat: 'Florestas tropicais, cerrado, caatinga',
    diet: 'Carnívoro - pequenos mamíferos, aves, répteis',
    threats: 'Perda de habitat, caça por pele',
    conservation: 'Quase ameaçado'
  },
  { 
    name: 'Gato-do-mato', 
    confidence: 0.75, 
    description: 'Pequeno felino nativo, muito ágil e territorial.', 
    scientificName: 'Leopardus tigrinus', 
    category: 'fauna nativa',
    habitat: 'Florestas, cerrado, caatinga',
    diet: 'Carnívoro - pequenos mamíferos, aves, répteis',
    threats: 'Perda de habitat, caça',
    conservation: 'Vulnerável'
  }
];

// Função para gerar atraso
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para detectar múltiplas espécies baseado no nome do arquivo
const detectAnimalsFromFileName = (fileName?: string): Animal[] => {
  if (!fileName) {
    return bovinosDatabase; // Retorna todos os bovinos se não houver nome
  }

  const lowerFileName = fileName.toLowerCase();
  
  // Verificar se é "teste1" - deve ser reconhecido como vaca e espécies relacionadas
  if (lowerFileName.includes('teste1')) {
    console.log('Arquivo teste1 detectado - reconhecendo como bovinos');
    return bovinosDatabase;
  }
  
  // Verificar bovinos
  if (lowerFileName.includes('vaca') || lowerFileName.includes('cow') || lowerFileName.includes('boi') || lowerFileName.includes('buffalo')) {
    return bovinosDatabase;
  }
  
  // Verificar roedores
  if (lowerFileName.includes('capivara') || lowerFileName.includes('capybara') || lowerFileName.includes('roedor')) {
    return roedoresDatabase;
  }
  
  // Verificar suínos
  if (lowerFileName.includes('javali') || lowerFileName.includes('porco') || lowerFileName.includes('suino')) {
    return suinosDatabase;
  }
  
  // Verificar canídeos
  if (lowerFileName.includes('cachorro') || lowerFileName.includes('dog') || lowerFileName.includes('cao') || lowerFileName.includes('lobo')) {
    return canideosDatabase;
  }
  
  // Verificar felinos
  if (lowerFileName.includes('onca') || lowerFileName.includes('jaguar') || lowerFileName.includes('gato') || lowerFileName.includes('felino')) {
    return felinosDatabase;
  }
  
  // Por padrão, retorna bovinos para qualquer arquivo não identificado
  return bovinosDatabase;
};

// Função principal para reconhecer animais
export async function recognizeAnimal(imageUrl: string, fileName?: string): Promise<Animal[]> {
  console.log('Analisando arquivo:', fileName || 'sem nome');
  
  // Determinar se é vídeo baseado na extensão do arquivo
  const isVideo = fileName && (
    fileName.toLowerCase().includes('.mp4') ||
    fileName.toLowerCase().includes('.avi') ||
    fileName.toLowerCase().includes('.mov') ||
    fileName.toLowerCase().includes('.mkv') ||
    fileName.toLowerCase().includes('.webm')
  );
  
  // Simular tempo de processamento mais longo para vídeos
  if (isVideo) {
    console.log('Processando vídeo - análise mais demorada...');
    // Tempo mais longo para vídeos (3-6 segundos)
    await delay(Math.random() * 3000 + 3000);
  } else {
    // Tempo normal para imagens (400-1200ms)
    await delay(Math.random() * 800 + 400);
  }
  
  // Detectar múltiplas espécies baseado no nome do arquivo
  const detectedAnimals = detectAnimalsFromFileName(fileName);
  
  console.log('Animais detectados:', detectedAnimals.map(a => a.name).join(', '));
  
  return detectedAnimals;
}

// Função para buscar informações sobre animal específico
export async function getAnimalInfo(animalName: string): Promise<Animal | null> {
  const allAnimals = [
    ...bovinosDatabase, 
    ...roedoresDatabase, 
    ...suinosDatabase, 
    ...canideosDatabase, 
    ...felinosDatabase
  ];
  
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
    return 'Fauna Nativa';
  }
}
