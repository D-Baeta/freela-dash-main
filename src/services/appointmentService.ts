import { BaseService } from "./baseService";
import { AppointmentSchema } from "../schemas/validationSchemas";
import { Appointment, Client } from "../types/models";
import { orderBy, query, where } from "firebase/firestore";
import { collection, where as whereQuery, query as queryFn, getDocs } from "firebase/firestore";
import { db } from "./firebase-config";
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

  // Return both real appointments and virtual recurrence instances for the given date range.
  // Virtual instances are generated from clients that have recurrence defined.
  async getEventsForRange(userId: string, startDate: string, endDate: string) {
    // Load real appointments in range
    const real = await this.getAppointmentsByDateRange(userId, startDate, endDate);

  // Load clients for this user to inspect recurrence
  const clientsQ = queryFn(collection(db, "clients"), whereQuery("userId", "==", userId));
  const clientsSnapshot = await getDocs(clientsQ);
  const clients = clientsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Client) })) as Client[];

    // Helper to check if an appointment already exists for a client at a given date/time
    const hasRealAt = (clientId: string, date: string, time: string) => {
      return real.some(r => r.clientId === clientId && r.date === date && r.time === time);
    };

  const virtual: Array<Record<string, unknown>> = [];
    for (const client of clients) {
      if (!client.recurrence) continue;
      const freq = client.recurrence.frequency;
      if (!client.recurrence.anchorDate || !client.recurrence.anchorTime) continue;

      const current = new Date(`${client.recurrence.anchorDate}T${client.recurrence.anchorTime}`);
      const end = new Date(`${endDate}T23:59:59`);
      const maxIter = 500;
      let iter = 0;

      // advance current to the startDate window
      const windowStart = new Date(`${startDate}T00:00:00`);
      while (current < windowStart) {
        if (freq === 'weekly') current.setDate(current.getDate() + 7);
        else if (freq === 'biweekly') current.setDate(current.getDate() + 14);
        else if (freq === 'monthly') current.setMonth(current.getMonth() + 1);
        iter++;
        if (iter > maxIter) break;
      }

      iter = 0;
      // Build a quick lookup for recurrence exceptions (dates that should be skipped)
      const exceptions = new Set<string>(
        (client.recurrence?.exceptions || []).map((e: { date: string }) => e.date),
      );

      while (current <= end && iter < maxIter) {
        const dateStr = current.toISOString().split('T')[0];
        const timeStr = current.toTimeString().slice(0,5);
        // Skip generation if this date is listed in exceptions (cancelled/rescheduled)
        if (exceptions.has(dateStr)) {
          // If there's an exception, don't generate the virtual occurrence for this date
        } else if (!hasRealAt(client.id, dateStr, timeStr)) {
          virtual.push({
            id: `virtual-${client.id}-${dateStr}-${timeStr}`,
            clientId: client.id,
            client,
            title: client.name,
            date: dateStr,
            time: timeStr,
            value: client.recurrence.value ?? 0,
            duration: client.recurrence.duration ?? 60,
            virtual: true,
          });
        }

        if (freq === 'weekly') current.setDate(current.getDate() + 7);
        else if (freq === 'biweekly') current.setDate(current.getDate() + 14);
        else if (freq === 'monthly') current.setMonth(current.getMonth() + 1);

        iter++;
      }
    }

    return { real, virtual };
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