import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "../contexts/authContextBase";
import { useClients } from "../hooks/useClients";

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClientModal = ({ open, onOpenChange }: ClientModalProps) => {
  const { firebaseUser } = useAuthContext();
  const { clients, loading, createClient } = useClients(firebaseUser?.uid);

  const [formData, setFormData] = useState<{ name: string; phone: string; email: string; createdAt: string }>({
    name: "",
    phone: "",
    email: "",
    createdAt: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    createClient({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      notes: formData.createdAt,
    })

    onOpenChange(false);
    // Reset form
    setFormData({
      name: "",
      phone: "",
      email: "",
      createdAt: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdAt">Data de Cadastro</Label>
              <Input
                id="createdAt"
                type="date"
                value={formData.createdAt}
                onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                required
              />
            </div>
            {/* Recurrence is set when creating an appointment, not when adding a client */}
          </div>
          <DialogFooter>
            <div className="flex flex-row justify-self-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
