
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <Card className="w-full max-w-md mx-auto p-6 backdrop-blur-sm bg-white/90 shadow-lg border-0">
      <div className="flex justify-center mb-6">
        <h1 className="text-4xl font-bold text-agrotech-blue">AgroTech</h1>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="text-sm text-agrotech-blue hover:underline"
              onClick={() => alert('Funcionalidade em desenvolvimento')}
            >
              Esqueceu a senha?
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
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
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
      
      {/* Demo info */}
      <div className="mt-4 p-2 bg-agrotech-gray/50 rounded text-center">
        <p className="text-xs text-gray-500">
          Demo: email@agrotech.com / senha123
        </p>
      </div>
    </Card>
  );
}
