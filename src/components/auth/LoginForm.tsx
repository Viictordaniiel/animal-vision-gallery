import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

type LoginFormProps = {
  onToggleRegister: () => void;
};

export default function LoginForm({ onToggleRegister }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Login ou senha inválidos!');
      }
    } catch (err) {
      setError('Erro ao realizar login. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto p-4 backdrop-blur-md bg-white/50 shadow-lg border-0">
      <div className="flex justify-center mb-4">
        <h1 className="text-3xl font-bold text-agrotech-blue">AgroInsight</h1>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Senha</Label>
            <button 
              type="button" 
              className="text-xs text-agrotech-blue hover:underline"
              onClick={() => alert('Funcionalidade em desenvolvimento')}
            >
              Esqueceu?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-agrotech-blue hover:bg-agrotech-darkblue"
          disabled={isLoading}
        >
          {isLoading ? 'Processando...' : 'Entrar'}
        </Button>
      </form>
      
      <div className="mt-4 text-center text-sm">
        <p className="text-xs text-gray-600">
          Não tem uma conta?{' '}
          <button 
            type="button" 
            className="text-agrotech-blue hover:underline"
            onClick={onToggleRegister}
          >
            Cadastre-se
          </button>
        </p>
      </div>
      
      <div className="mt-3 p-1 bg-agrotech-gray/50 rounded text-center">
        <p className="text-xs text-gray-500">
          Demo: email@agrotech.com / senha123
        </p>
      </div>
    </Card>
  );
}
