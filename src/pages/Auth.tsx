
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

export default function Auth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirecionar para a página principal se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/gallery');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-center bg-cover bg-no-repeat"
         style={{backgroundImage: `url('/lovable-uploads/055cd44a-57f9-4a05-8a92-dd3c646aeed3.png')`}}>
      <div className="w-full max-w-sm">
        {isRegistering ? (
          <RegisterForm onToggleLogin={() => setIsRegistering(false)} />
        ) : (
          <LoginForm onToggleRegister={() => setIsRegistering(true)} />
        )}
      </div>
    </div>
  );
}
