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
    return this.create({ ...data, userId });
  }

  async updateClient(clientId: string, data: Partial<Client>): Promise<void> {
    return this.update(clientId, data);
  }

  async deleteClient(clientId: string): Promise<void> {
    return this.delete(clientId);
  }

  async getClientsByUser(userId: string): Promise<Client[]> {
    return this.getAllByUser(userId);
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