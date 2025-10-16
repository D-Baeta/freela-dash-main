import { BaseService } from "./baseService";
import { PaymentSchema } from "../schemas/validationSchemas";
import { Payment } from "../types/models";
import { orderBy, query, where } from "firebase/firestore";
import { z } from "zod";

export class PaymentService extends BaseService<Payment> {
  protected collectionName = "payments";
  protected schema = PaymentSchema as z.ZodSchema<Payment>;

  async getAllByUser(userId: string): Promise<Payment[]> {
    return super.getAllByUser(userId, [orderBy("date", "desc")]);
  }

  async getPaymentsByStatus(userId: string, status: Payment['status']): Promise<Payment[]> {
    return super.getAllByUser(userId, [
      where("status", "==", status),
      orderBy("date", "desc")
    ]);
  }

  async getPaymentsByMethod(userId: string, method: Payment['method']): Promise<Payment[]> {
    return super.getAllByUser(userId, [
      where("method", "==", method),
      orderBy("date", "desc")
    ]);
  }

  async getPaymentsByDateRange(userId: string, startDate: string, endDate: string): Promise<Payment[]> {
    return super.getAllByUser(userId, [
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    ]);
  }

  async getPaymentsByAppointment(userId: string, appointmentId: string): Promise<Payment[]> {
    return super.getAllByUser(userId, [
      where("appointmentId", "==", appointmentId),
      orderBy("date", "desc")
    ]);
  }

  async getTotalByStatus(userId: string, status: Payment['status']): Promise<number> {
    const payments = await this.getPaymentsByStatus(userId, status);
    return payments.reduce((total, payment) => total + payment.value, 0);
  }

  async getTotalByMethod(userId: string, method: Payment['method']): Promise<number> {
    const payments = await this.getPaymentsByMethod(userId, method);
    return payments.reduce((total, payment) => total + payment.value, 0);
  }

  async getMonthlyTotal(userId: string, year: number, month: number): Promise<number> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    const payments = await this.getPaymentsByDateRange(userId, startDate, endDate);
    return payments.reduce((total, payment) => total + payment.value, 0);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();