
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar para a página apropriada baseada no estado de autenticação
    if (isAuthenticated) {
      navigate('/gallery');
    } else {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Uma página de carregamento simples com a nova imagem de fundo
  return (
    <div className="min-h-screen flex items-center justify-center bg-drone-farm bg-cover bg-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agrotech-blue"></div>
    </div>
  );
};

export default Index;
