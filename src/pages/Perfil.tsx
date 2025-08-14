import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Calendar, Camera, Lock, UserPlus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { DeleteAccountModal } from "@/components/auth/DeleteAccountModal";
import { AddSharedUserModal } from '@/components/modals/AddSharedUserModal';
import { supabase } from '@/lib/supabase';

const Perfil = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, loading, updateProfile, uploadAvatar } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<{ id: any; name: string; whatsapp: string; }[]>([]);

  useEffect(() => {
    const fetchSharedUsers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('shared_access')
          .select('id, shared_user_name, shared_user_whatsapp')
          .eq('owner_user_id', user.id);

        if (error) {
          toast({ title: "Erro ao buscar usuários compartilhados", description: error.message, variant: "destructive" });
        } else if (data) {
          setSharedUsers(data.map(u => ({ id: u.id, name: u.shared_user_name, whatsapp: u.shared_user_whatsapp })));
        }
      }
    };

    fetchSharedUsers();
  }, [toast]);

  const handleAddSharedUser = async (name: string, whatsapp: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
  
    if (!profile || !profile.telefone) {
      toast({ 
        title: "Erro de Perfil", 
        description: "Seu número de telefone não foi carregado. Por favor, atualize a página e tente novamente.", 
        variant: "destructive" 
      });
      return;
    }
  
    const { data, error } = await supabase
      .from('shared_access')
      .insert([{ 
        user_id: user.id,  // This was the missing field
        owner_user_id: user.id, 
        owner_user_phone: profile.telefone, 
        shared_user_name: name, 
        shared_user_whatsapp: whatsapp,
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single();
  
    if (error) {
      console.error('Error details:', error);
      toast({ 
        title: "Erro ao adicionar usuário", 
        description: error.message, 
        variant: "destructive" 
      });
    } else if (data) {
      setSharedUsers(prev => [...prev, { 
        id: data.id, 
        name, 
        whatsapp 
      }]);
      toast({ 
        title: "Sucesso", 
        description: "Usuário compartilhado adicionado com sucesso!" 
      });
    }
  };

  const handleRemoveSharedUser = async (userIdToRemove: any) => {
    const { error } = await supabase
      .from('shared_access')
      .delete()
      .eq('id', userIdToRemove);

    if (error) {
      toast({ title: "Erro ao remover acesso", description: error.message, variant: "destructive" });
    } else {
      setSharedUsers(sharedUsers.filter(user => user.id !== userIdToRemove));
      toast({ title: "Acesso removido!", description: `O usuário foi removido da lista de compartilhamento.` });
    }
  };
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    avatar: ""
  });

  // Carregar dados do perfil quando disponível
  useEffect(() => {
    if (profile && user) {
      setFormData({
        nome: profile.name || "",
        email: user.email || "",
        telefone: profile.telefone || "",
        endereco: profile.endereco || "",
        avatar: profile.avatar_url || ""
      });
    }
  }, [profile, user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        return;
      }

      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Fazer upload real para Supabase Storage
      const avatarUrl = await uploadAvatar(file);
      
      if (avatarUrl) {
        // Atualizar o estado local para mostrar a nova imagem
        setFormData(prev => ({
          ...prev,
          avatar: avatarUrl
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    const success = await updateProfile({
      name: formData.nome,
      telefone: formData.telefone,
      endereco: formData.endereco,
      avatar_url: formData.avatar
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Resetar para dados originais
    if (profile && user) {
      setFormData({
        nome: profile.name || "",
        email: user.email || "",
        telefone: profile.telefone || "",
        endereco: profile.endereco || "",
        avatar: profile.avatar_url || ""
      });
    }
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Formatação de data de registro
  const formatRegistrationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
            <p className="mt-4 text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Perfil</h2>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Avatar e informações básicas */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24 cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage src={formData.avatar} />
                    <AvatarFallback>{getInitials(formData.nome)}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                    onClick={handleAvatarClick}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              <CardTitle className="mt-4">{formData.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Membro desde {profile ? formatRegistrationDate(profile.created_at) : 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{formData.endereco}</span>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de segurança */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-green-500" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <Lock className="w-4 h-4 mr-3" />
                Alterar Senha
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteAccountModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Excluir Conta
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-green-500" />
              Informações Pessoais
            </CardTitle>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
              >
                Editar
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Salvar
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compartilhar Acesso */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-green-500" />
              Compartilhar Acesso
            </CardTitle>
            <Button onClick={() => setIsAddUserModalOpen(true)}>Adicionar</Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Adicione usuários para compartilhar o acesso a esta conta. Eles poderão registrar e visualizar os dados.</p>
            <div className="space-y-2">
              {sharedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.whatsapp}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveSharedUser(user.id)}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Modais */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
      
      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
      />
      <AddSharedUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onAddUser={handleAddSharedUser}
      />
    </DashboardLayout>
  );
};

export default Perfil;
