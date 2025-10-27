import { BaseService } from "./baseService";
import { ClientSchema } from "../schemas/validationSchemas";
import { Client } from "../types/models";
import { orderBy, query, where } from "firebase/firestore";
import { z } from "zod";

export class ClientService extends BaseService<Client> {
  protected collectionName = "clients";
  protected schema = ClientSchema as z.ZodSchema<Client>;

  async getAllByUser(userId: string): Promise<Client[]> {
    return super.getAllByUser(userId, [orderBy("createdAt", "desc")]);
  }

  async searchClients(userId: string, searchTerm: string): Promise<Client[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation. For production, consider using Algolia or similar
    const allClients = await this.getAllByUser(userId);
    return allClients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    );
  }

  async getClientByName(userId: string, name: string): Promise<Client[]> {
    return super.getAllByUser(userId, [
      where("name", ">=", name),
      where("name", "<=", name + "\uf8ff")
    ]);
  }

  // Legacy function support (for backward compatibility)
  async addClient(userId: string, data: Omit<Client, "userId" | "createdAt">): Promise<string> {
    // If caller supplied a recurrence object but omitted `active`, default it to true
    const payload = { ...data } as Omit<Client, "userId" | "createdAt"> & { recurrence?: Client["recurrence"] };
    if (payload.recurrence && payload.recurrence.active === undefined) {
      payload.recurrence = { ...payload.recurrence, active: true };
    }

    return this.create({ ...payload, userId });
  }

  async updateClient(clientId: string, data: Partial<Client>): Promise<void> {
    // If updating recurrence and `active` is omitted, default to true so new recurrences are active by default
    const updateData = { ...data } as Partial<Client> & { recurrence?: Client["recurrence"] };
    if (updateData.recurrence && updateData.recurrence.active === undefined) {
      updateData.recurrence = { ...updateData.recurrence, active: true } as Client["recurrence"];
    }

    return this.update(clientId, updateData);
  }

  async deleteClient(clientId: string): Promise<void> {
    return this.delete(clientId);
  }

  async getClientsByUser(userId: string): Promise<Client[]> {
    return this.getAllByUser(userId);
  }

  /**
   * Append a recurrence exception to a client to mark a specific recurrence
   * occurrence as cancelled or rescheduled. This avoids regenerating the
   * original virtual instance.
   */
  async addRecurrenceException(clientId: string, exception: { date: string; type: "cancelled" | "rescheduled"; newDate?: string; newTime?: string }) {
    const client = await this.getById(clientId);
    if (!client) throw new Error("Client not found");

    const recurrence = client.recurrence || {};
    const existing = recurrence.exceptions || [];
    const updated = {
      ...recurrence,
      exceptions: [...existing, exception],
    };

    await this.update(clientId, { recurrence: updated });
  }
}

// Export singleton instance
export const clientService = new ClientService();

// Legacy exports for backward compatibility
export const addClient = (userId: string, data: Omit<Client, "userId" | "createdAt">) => 
  clientService.addClient(userId, data);

export const updateClient = (clientId: string, data: Partial<Client>) => 
  clientService.updateClient(clientId, data);

export const deleteClient = (clientId: string) => 
  clientService.deleteClient(clientId);

export const getClientsByUser = (userId: string) => 
  clientService.getClientsByUser(userId);