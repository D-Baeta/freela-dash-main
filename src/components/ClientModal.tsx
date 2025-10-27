import { useState, useEffect } from "react";
import { Client } from "@/types/models";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "../contexts/authContextBase";
import { useClients } from "../hooks/useClients";

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  /** If true, modal opens in read-only view; user can toggle Edit inside the modal */
  viewOnly?: boolean;
}

export const ClientModal = ({ open, onOpenChange, client, viewOnly = false }: ClientModalProps) => {
  const { firebaseUser } = useAuthContext();
  const { clients, loading, createClient, editClient } = useClients(firebaseUser?.uid);
  // editingEnabled controls whether the form is editable. When viewOnly prop is true,
  // start with editing disabled and let the user click the internal Edit button to enable it.
  const [editingEnabled, setEditingEnabled] = useState<boolean>(!viewOnly);

  const [formData, setFormData] = useState<{ name: string; phone?: string; email?: string; createdAt: string; beginningDate?: string; birthDate?: string; address?: string; cpf?: string }>(
    {
      name: "",
      phone: "",
      email: "",
      createdAt: new Date().toISOString().split('T')[0],
      beginningDate: undefined,
      birthDate: undefined,
      address: undefined,
      cpf: undefined,
    }
  );

  // populate when editing
  useEffect(() => {
    type FirestoreTimestamp = { toDate: () => Date };
    const isFirestoreTimestamp = (v: unknown): v is FirestoreTimestamp =>
      typeof v === 'object' && v !== null && 'toDate' in (v as object) && typeof (v as { toDate?: unknown }).toDate === 'function';

    const formatToInputDate = (val: unknown): string => {
      if (!val) return '';
      // Firestore Timestamp-like
      if (isFirestoreTimestamp(val)) {
        const d = val.toDate();
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
      }
      // Date instance
      if (val instanceof Date) {
        return isNaN(val.getTime()) ? '' : val.toISOString().split('T')[0];
      }
      // ISO string or YYYY-MM-DD
      if (typeof val === 'string') {
        // if already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
      }
      return '';
    };

    if (client) {
      setFormData({
        name: client.name ?? "",
        phone: client.phone ?? "",
        email: client.email ?? "",
        createdAt: formatToInputDate(client.createdAt) || new Date().toISOString().split('T')[0],
        beginningDate: formatToInputDate(client.beginningDate) || undefined,
        birthDate: formatToInputDate(client.birthDate) || undefined,
        address: client.address ?? undefined,
        cpf: client.cpf ?? undefined,
      });
      // If opening an existing client and viewOnly is true, ensure editing is disabled
      setEditingEnabled(!viewOnly);
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        createdAt: new Date().toISOString().split('T')[0],
        beginningDate: undefined,
        birthDate: undefined,
        address: undefined,
        cpf: undefined,
      });
      // Creating new client should always be editable
      setEditingEnabled(true);
    }
  }, [client, viewOnly]);

  const resetFormFromClient = () => {
    const isFirestoreTimestamp = (v: unknown): v is { toDate: () => Date } =>
      typeof v === 'object' && v !== null && 'toDate' in (v as object) && typeof (v as { toDate?: unknown }).toDate === 'function';

    const formatToInputDate = (val: unknown): string => {
      if (!val) return '';
      if (isFirestoreTimestamp(val)) {
        const d = val.toDate();
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
      }
      if (val instanceof Date) {
        return isNaN(val.getTime()) ? '' : val.toISOString().split('T')[0];
      }
      if (typeof val === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
      }
      return '';
    };

    if (client) {
      setFormData({
        name: client.name ?? "",
        phone: client.phone ?? "",
        email: client.email ?? "",
        createdAt: formatToInputDate(client.createdAt) || new Date().toISOString().split('T')[0],
        beginningDate: formatToInputDate(client.beginningDate) || undefined,
        birthDate: formatToInputDate(client.birthDate) || undefined,
        address: client.address ?? undefined,
        cpf: client.cpf ?? undefined,
      });
      setEditingEnabled(!viewOnly);
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        createdAt: new Date().toISOString().split('T')[0],
        beginningDate: undefined,
        birthDate: undefined,
        address: undefined,
        cpf: undefined,
      });
      setEditingEnabled(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  if (!firebaseUser) return;

    try {
      if (client && client.id) {
        await editClient(client.id, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          beginningDate: formData.beginningDate,
          birthDate: formData.birthDate,
          address: formData.address,
          cpf: formData.cpf,
        });
      } else {
        await createClient({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.createdAt,
          beginningDate: formData.beginningDate,
          birthDate: formData.birthDate,
          address: formData.address,
          cpf: formData.cpf,
        });
      }

      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao salvar cliente', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{client ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>
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
                disabled={!editingEnabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editingEnabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!editingEnabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="beginningDate">Data de Início</Label>
              <Input
                id="beginningDate"
                type="date"
                value={formData.beginningDate ?? ''}
                onChange={(e) => setFormData({ ...formData, beginningDate: e.target.value })}
                disabled={!editingEnabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate ?? ''}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                disabled={!editingEnabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address ?? ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!editingEnabled}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf ?? ''}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
                disabled={!editingEnabled}
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex flex-row justify-self-end gap-4">
              <Button type="button" variant="outline" onClick={() => {
                // If we are in view-only and currently editing, cancel should revert edits and return to view mode
                if (viewOnly && editingEnabled) {
                  resetFormFromClient();
                  return;
                }
                onOpenChange(false);
              }}>
                Cancelar
              </Button>
              {/* If we're in viewOnly mode and editing isn't enabled yet, show an internal Edit button that enables editing. */}
              {viewOnly && !editingEnabled ? (
                <Button type="button" onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setEditingEnabled(true); }}>Editar</Button>
              ) : (
                <Button type="submit">{client ? 'Salvar' : 'Adicionar'}</Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
