import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Gallery from '@/components/gallery/Gallery';
import InvasiveSpeciesGallery from '@/components/gallery/InvasiveSpeciesGallery';
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

export default function GalleryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
  
  const handleLogout = (e) => {
    e.preventDefault(); // Previne o comportamento padrão
    logout();
    navigate('/');
  };

  const handleChangePassword = (e) => {
    e.preventDefault(); // Já estava implementado
    // Esta é uma implementação simulada para demonstração
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
    e.preventDefault(); // Já estava implementado
    // Implementação simulada
    toast({
      title: "Sucesso",
      description: "Número de telefone atualizado com sucesso!",
    });
    setShowChangePhoneDialog(false);
  };

  const handleChangeEmail = (e) => {
    e.preventDefault(); // Já estava implementado
    // Implementação simulada
    toast({
      title: "Sucesso",
      description: "Email atualizado com sucesso!",
    });
    setShowChangeEmailDialog(false);
  };

  const handleEditProfile = (e) => {
    e.preventDefault(); // Já estava implementado
    // Implementação simulada
    toast({
      title: "Sucesso",
      description: "Perfil atualizado com sucesso!",
    });
    setShowEditProfileDialog(false);
  };

  const navigateToSettings = (e) => {
    e.preventDefault(); // Previne o comportamento padrão
    setIsMenuOpen(false);
    navigate('/settings');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h2 className="text-xl font-bold text-agrotech-blue">AgroInsight</h2>
          
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="text-xs">{user?.name || user?.email}</span>
            </Button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10 border">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <p className="font-semibold text-xs">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={navigateToSettings}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Configurações</span>
                </button>
                
                <div className="border-t my-1"></div>
                
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="detection" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detection">Detecção de Animais</TabsTrigger>
              <TabsTrigger value="gallery">Galeria de Invasoras</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detection" className="mt-6">
              <Gallery />
            </TabsContent>
            
            <TabsContent value="gallery" className="mt-6">
              <InvasiveSpeciesGallery />
            </TabsContent>
          </Tabs>
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
