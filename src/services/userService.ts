import { BaseService } from "./baseService";
import { UserSchema } from "../schemas/validationSchemas";
import { User } from "../types/models";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase-config";
import { z } from "zod";

export class UserService extends BaseService<User> {
  protected collectionName = "users";
  protected schema = UserSchema as z.ZodSchema<User>;

  async createUser(userId: string, data: Omit<User, "id" | "createdAt">): Promise<void> {
    try {
      const validatedData = this.validateData(data);
      const userRef = doc(db, this.collectionName, userId);
      
      await setDoc(userRef, {
        ...validatedData,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      this.handleFirestoreError(error, 'criar usuário');
    }
  }

  async getAll(): Promise<User[]> {
    try {
      const users = await this.getAllByUser(""); // Empty userId to get all users
      return users;
    } catch (error) {
      this.handleFirestoreError(error, 'buscar todos os usuários');
    }
  }

  async updatePlan(userId: string, plan: User['plan']): Promise<void> {
    return this.update(userId, { plan });
  }

  async updateProfile(userId: string, data: Partial<Pick<User, 'name' | 'profession'>>): Promise<void> {
    return this.update(userId, data);
  }

  async getUserStats(userId: string): Promise<{
    totalClients: number;
    totalAppointments: number;
    totalRevenue: number;
    completedAppointments: number;
  }> {
    // This would typically involve aggregating data from multiple collections
    // For now, return basic structure - implement based on your needs
    return {
      totalClients: 0,
      totalAppointments: 0,
      totalRevenue: 0,
      completedAppointments: 0,
    };
  }
}

// Export singleton instance
export const userService = new UserService();