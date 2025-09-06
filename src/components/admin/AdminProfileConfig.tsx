import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { Mail, Key, Loader2 } from 'lucide-react';

const AdminProfileConfig = () => {
  const { user, updateUserProfile } = useAppContext();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdatingProfile(true);
    
    try {
      console.log('AdminProfileConfig: Updating profile...');
      
      // Update name using the context method
      if (name !== user?.name) {
        console.log('AdminProfileConfig: Updating name from', user?.name, 'to', name);
        await updateUserProfile({ name });
      }
      
      // Update email if changed using admin function (no confirmation required)
      if (email !== user?.email) {
        console.log('AdminProfileConfig: Updating admin email');
        
        const { data, error } = await supabase.functions.invoke('update-admin-email', {
          body: { email: email }
        });

        if (error) {
          console.error('AdminProfileConfig: Email update error:', error);
          toast({
            title: 'Erro',
            description: error.message || 'Erro ao atualizar email',
            variant: 'destructive',
          });
          return;
        }
        
        console.log('AdminProfileConfig: Email update success');
        toast({
          title: 'Sucesso',
          description: 'Email atualizado com sucesso sem necessidade de confirmação.',
        });
      }
      
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso',
      });
      
      setIsEditing(false);
      console.log('AdminProfileConfig: Profile update completed successfully');
      
    } catch (error) {
      console.error("AdminProfileConfig: Error updating profile:", error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar perfil',
        variant: 'destructive',
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }
    
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso',
      });
      
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar senha',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Administrador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.profileImage} />
              <AvatarFallback className="text-lg">{name?.charAt(0) || email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{user?.name || 'Administrador'}</h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="font-medium">Nome</label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Seu nome completo" 
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="email" className="font-medium">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="seu@email.com" 
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={updatingProfile}>
                  {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Editar Informações</Button>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="newPassword" className="font-medium">Nova Senha</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  id="newPassword" 
                  type="password"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="confirmPassword" className="font-medium">Confirmar Senha</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" disabled={changingPassword}>
              {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfileConfig;
