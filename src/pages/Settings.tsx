
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Mail, Phone, Lock, Edit } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showChangePhoneDialog, setShowChangePhoneDialog] = useState(false);
  const [showChangeEmailDialog, setShowChangeEmailDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const { toast } = useToast();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Senha alterada com sucesso!",
    });
    setShowChangePasswordDialog(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePhone = (e) => {
    e.preventDefault();
    toast({
      title: "Sucesso",
      description: "Número de telefone atualizado com sucesso!",
    });
    setShowChangePhoneDialog(false);
  };

  const handleChangeEmail = (e) => {
    e.preventDefault();
    toast({
      title: "Sucesso",
      description: "Email atualizado com sucesso!",
    });
    setShowChangeEmailDialog(false);
  };

  const handleEditProfile = (e) => {
    e.preventDefault();
    toast({
      title: "Sucesso",
      description: "Perfil atualizado com sucesso!",
    });
    setShowEditProfileDialog(false);
  };

  const goBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" onClick={goBack} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold text-agrotech-blue">Configurações</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs">{user?.name || user?.email}</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Configurações da Conta</h2>

          <div className="space-y-4">
            <div className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => setShowEditProfileDialog(true)}>
              <div className="flex items-center">
                <Edit className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <h3 className="font-medium">Editar Perfil</h3>
                  <p className="text-sm text-gray-500">Atualize suas informações pessoais</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => setShowChangePasswordDialog(true)}>
              <div className="flex items-center">
                <Lock className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <h3 className="font-medium">Alterar Senha</h3>
                  <p className="text-sm text-gray-500">Atualize sua senha de acesso</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => setShowChangePhoneDialog(true)}>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <h3 className="font-medium">Gerenciar Telefone</h3>
                  <p className="text-sm text-gray-500">Adicione ou atualize seu número de telefone</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => setShowChangeEmailDialog(true)}>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <h3 className="font-medium">Alterar Email</h3>
                  <p className="text-sm text-gray-500">Atualize seu endereço de email</p>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer text-red-600" onClick={handleLogout}>
              <div className="flex items-center">
                <LogOut className="h-5 w-5 mr-3" />
                <div>
                  <h3 className="font-medium">Sair</h3>
                  <p className="text-sm text-red-500">Encerrar sessão atual</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} AgroInsight. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Diálogo para alterar senha */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para alterar sua senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Senha atual</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para gerenciar telefone */}
      <Dialog open={showChangePhoneDialog} onOpenChange={setShowChangePhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar número de telefone</DialogTitle>
            <DialogDescription>
              Atualize seu número de telefone para receber notificações.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePhone}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Número de telefone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="(00) 00000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para alterar email */}
      <Dialog open={showChangeEmailDialog} onOpenChange={setShowChangeEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar email</DialogTitle>
            <DialogDescription>
              Digite seu novo endereço de email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangeEmail}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="current-email">Email atual</Label>
                <Input 
                  id="current-email" 
                  type="email" 
                  value={user?.email}
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-email">Novo email</Label>
                <Input 
                  id="new-email" 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar perfil */}
      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProfile}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">Nome completo</Label>
                <Input 
                  id="full-name" 
                  defaultValue={user?.name || ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  defaultValue={user?.email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">
                  Para alterar seu email, use a opção específica no menu.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
