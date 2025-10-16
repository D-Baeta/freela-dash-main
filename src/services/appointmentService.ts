import { BaseService } from "./baseService";
import { AppointmentSchema } from "../schemas/validationSchemas";
import { Appointment } from "../types/models";
import { orderBy, query, where } from "firebase/firestore";
import { z } from "zod";

export class AppointmentService extends BaseService<Appointment> {
  protected collectionName = "appointments";
  protected schema = AppointmentSchema as z.ZodSchema<Appointment>;

  async getAllByUser(userId: string): Promise<Appointment[]> {
    return super.getAllByUser(userId, [orderBy("date", "desc")]);
  }

  async getUpcomingAppointments(userId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return super.getAllByUser(userId, [
      where("date", ">=", today),
      orderBy("date", "asc"),
      orderBy("time", "asc")
    ]);
  }

  async getAppointmentsByDateRange(userId: string, startDate: string, endDate: string): Promise<Appointment[]> {
    return super.getAllByUser(userId, [
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc"),
      orderBy("time", "asc")
    ]);
  }

  async getAppointmentsByStatus(userId: string, status: Appointment['status']): Promise<Appointment[]> {
    return super.getAllByUser(userId, [
      where("status", "==", status),
      orderBy("date", "desc")
    ]);
  }

  async getAppointmentsByPaymentStatus(userId: string, paymentStatus: Appointment['paymentStatus']): Promise<Appointment[]> {
    return super.getAllByUser(userId, [
      where("paymentStatus", "==", paymentStatus),
      orderBy("date", "desc")
    ]);
  }

  // Override update to exclude client data from Firestore updates
  async update(id: string, data: Partial<Appointment>): Promise<void> {
    const { client, ...dataWithoutClient } = data;
    return super.update(id, dataWithoutClient);
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();