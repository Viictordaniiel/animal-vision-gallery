
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    try {
      // Simulação de login - em uma app real, isso seria integrado com API real
      if (email && password) {
        // Mock para demonstração
        if (email === 'demo@agrotech.com' && password === 'senha123') {
          setUser({
            id: '1',
            email: email,
            name: 'Usuário Demo'
          });
          
          // Armazenar no localStorage para manter sessão
          localStorage.setItem('agrotech_user', JSON.stringify({
            id: '1',
            email: email,
            name: 'Usuário Demo'
          }));
          
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo à plataforma AgroTech.",
          });
          
          return true;
        } else {
          toast({
            title: "Erro no login",
            description: "Email ou senha inválidos!",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao processar seu login.",
        variant: "destructive"
      });
    }
    return false;
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      // Simulação de registro - em uma app real, isso seria integrado com API real
      if (email && password) {
        // Registro de um novo usuário demo
        setUser({
          id: Date.now().toString(),
          email: email,
          name: name
        });
        
        toast({
          title: "Registro realizado com sucesso!",
          description: "Sua conta foi criada na plataforma AgroTech.",
        });
        
        return true;
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      toast({
        title: "Erro no registro",
        description: "Ocorreu um erro ao processar seu registro.",
        variant: "destructive"
      });
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agrotech_user');
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
  };

  // Verificar no carregamento se existe um usuário no localStorage
  React.useEffect(() => {
    const storedUser = localStorage.getItem('agrotech_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Erro ao recuperar usuário:', e);
        localStorage.removeItem('agrotech_user');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
