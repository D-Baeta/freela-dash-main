import { useState, useCallback, useMemo, useEffect } from "react";
import { paymentService } from "../services/paymentService";
import { Payment } from "../types/models";
// Removed useErrorHandler to prevent infinite loops
import { toast } from "sonner";

interface UsePaymentReturn {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  fetchPayments: () => Promise<void>;
  createPayment: (data: Omit<Payment, "id" | "userId">) => Promise<void>;
  updatePayment: (paymentId: string, data: Partial<Payment>) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  refreshPayments: () => Promise<void>;
  getPaymentsByStatus: (status: Payment['status']) => Payment[];
  getPaymentsByMethod: (method: Payment['method']) => Payment[];
  getTotalByStatus: (status: Payment['status']) => number;
  getTotalByMethod: (method: Payment['method']) => number;
  getMonthlyTotal: (year: number, month: number) => Promise<number>;
  getPaymentByAppointment: (appointmentId: string) => Promise<Payment>
}

export const usePayment = (userId?: string): UsePaymentReturn => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Removed useErrorHandler to prevent infinite loops

  // Fetch payments on mount
  useEffect(() => {
    if (userId) {
      fetchPayments();
    }
  }, [userId]);

  // Fetch all payments
  const fetchPayments = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await paymentService.getAllByUser(userId);
      setPayments(data);
    } catch (err) {
      const errorMessage = "Erro ao buscar pagamentos";
      setError(errorMessage);
      console.error(err as Error, "fetchPayments");
      toast.error(errorMessage);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Create payment with optimistic update
  const createPayment = useCallback(
    async (data: Omit<Payment, "id" | "userId">) => {
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      const tempId = `temp-${Date.now()}`;
      const optimisticPayment: Payment = {
        ...data,
        id: tempId,
        userId,
      };

      // Optimistic update
      setPayments(prev => [optimisticPayment, ...prev]);

      try {
        const paymentId = await paymentService.create({ ...data, userId });
        
        // Replace optimistic update with real data
        setPayments(prev => 
          prev.map(payment => 
            payment.id === tempId 
              ? { ...payment, id: paymentId }
              : payment
          )
        );
        
        toast.success("Pagamento registrado com sucesso!");
      } catch (err) {
        // Revert optimistic update
        setPayments(prev => prev.filter(payment => payment.id !== tempId));
        
        const errorMessage = "Erro ao registrar pagamento";
        console.error(err as Error, "createPayment");
        toast.error(errorMessage);
        throw err;
      }
    },
    [userId]
  );

  // Update payment with optimistic update
  const updatePayment = useCallback(
    async (paymentId: string, data: Partial<Payment>) => {
      // Store original data for rollback
      const originalPayment = payments.find(p => p.id === paymentId);
      if (!originalPayment) {
        throw new Error("Pagamento não encontrado");
      }

      // Optimistic update
      setPayments(prev =>
        prev.map(p => (p.id === paymentId ? { ...p, ...data } : p))
      );

      try {
        await paymentService.update(paymentId, data);
        toast.success("Pagamento atualizado com sucesso!");
      } catch (err) {
        // Revert optimistic update
        setPayments(prev =>
          prev.map(p => (p.id === paymentId ? originalPayment : p))
        );
        
        const errorMessage = "Erro ao atualizar pagamento";
        console.error(err as Error, "updatePayment");
        toast.error(errorMessage);
        throw err;
      }
    },
    [payments]
  );

  // Delete payment with optimistic update
  const deletePayment = useCallback(
    async (paymentId: string) => {
      // Store original data for rollback
      const originalPayment = payments.find(p => p.id === paymentId);
      if (!originalPayment) {
        throw new Error("Pagamento não encontrado");
      }

      // Optimistic update
      setPayments(prev => prev.filter(p => p.id !== paymentId));

      try {
        await paymentService.delete(paymentId);
        toast.success("Pagamento removido com sucesso!");
      } catch (err) {
        // Revert optimistic update
        setPayments(prev => [...prev, originalPayment]);
        
        const errorMessage = "Erro ao remover pagamento";
        console.error(err as Error, "deletePayment");
        toast.error(errorMessage);
        throw err;
      }
    },
    [payments]
  );

  // Refresh payments manually
  const refreshPayments = useCallback(async () => {
    await fetchPayments();
  }, [fetchPayments]);

  // Get payments by status
  const getPaymentsByStatus = useCallback((status: Payment['status']) => {
    return payments.filter(p => p.status === status);
  }, [payments]);

  // Get payments by method
  const getPaymentsByMethod = useCallback((method: Payment['method']) => {
    return payments.filter(p => p.method === method);
  }, [payments]);

  // Get total by status
  const getTotalByStatus = useCallback((status: Payment['status']) => {
    return payments
      .filter(p => p.status === status)
      .reduce((total, payment) => total + payment.value, 0);
  }, [payments]);

  // Get total by method
  const getTotalByMethod = useCallback((method: Payment['method']) => {
    return payments
      .filter(p => p.method === method)
      .reduce((total, payment) => total + payment.value, 0);
  }, [payments]);

  const getPaymentByAppointment = useCallback(async (appointmentId: string) => {
    if (!userId) return null;

    try {
      const result = await paymentService.getPaymentByAppointment(userId, appointmentId);
      return result[0] || null; 
    } catch (err) {
      console.error(err, "getPaymentByAppointment");
      return null;
    }
  }, [userId]);

  // Get monthly total
  const getMonthlyTotal = useCallback(async (year: number, month: number) => {
    if (!userId) return 0;
    
    try {
      return await paymentService.getMonthlyTotal(userId, year, month);
    } catch (err) {
      console.error(err as Error, "getMonthlyTotal");
      return 0;
    }
  }, [userId]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      payments,
      loading,
      error,
      fetchPayments,
      createPayment,
      updatePayment,
      deletePayment,
      refreshPayments,
      getPaymentsByStatus,
      getPaymentsByMethod,
      getTotalByStatus,
      getTotalByMethod,
      getMonthlyTotal,
      getPaymentByAppointment,
    }),
    [
      payments,
      loading,
      error,
      fetchPayments,
      createPayment,
      updatePayment,
      deletePayment,
      refreshPayments,
      getPaymentsByStatus,
      getPaymentsByMethod,
      getTotalByStatus,
      getTotalByMethod,
      getMonthlyTotal,
      getPaymentByAppointment,
    ]
  );
};