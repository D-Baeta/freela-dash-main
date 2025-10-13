import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendEmail } from '../functions/sendEmail';

interface PreRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PreRegistrationModal: React.FC<PreRegistrationModalProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profession: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendEmail({
          name: formData.name,
          email: formData.email,
          profession: formData.profession,
          reason: formData.reason,
        }
      );

      setSent(true);
      setFormData({ name: "", email: "", profession: "", reason: "" });
    } catch (err) {
      console.error("Erro ao enviar email:", err);
      alert("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Entre em contato</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-6">
            <p className="text-green-600 font-medium">Mensagem enviada com sucesso!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-sm font-medium">Profissão</label>
              <Input name="profession" value={formData.profession} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-sm font-medium">Motivo do contato</label>
              <Textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={3}
                placeholder="Conte um pouco sobre o motivo do seu contato..."
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
