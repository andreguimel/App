import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddSharedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (name: string, whatsapp: string) => void;
}

export const AddSharedUserModal = ({ isOpen, onClose, onAddUser }: AddSharedUserModalProps) => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleAdd = () => {
    if (name && whatsapp) {
      onAddUser(name, whatsapp);
      onClose();
      setName('');
      setWhatsapp('');
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Acesso</DialogTitle>
          <DialogDescription>
            Digite o nome e o WhatsApp da pessoa com quem deseja compartilhar o acesso.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do usuário" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(99) 99999-9999" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAdd} className="bg-green-500 hover:bg-green-600">Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
