// src/hooks/use-payment.ts

import { useState, useCallback, useMemo } from "react";
import { paymentService } from "../services/paymentService";
import { Payment } from "../types/models";

/**
 * Hook customizado para gerenciar operações relacionadas a pagamentos.
 * @param userId O ID do usuário logado para filtrar os pagamentos.
 */
export const usePayment = (userId: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // --- Funções de Leitura (CRUD: Read) ---

  /**
   * Busca todos os pagamentos associados ao userId.
   */
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.getAllByUser(userId);
      setPayments(data);
      return data;
    } catch (err) {
      const fetchError = err as Error;
      setError(fetchError);
      console.error("Erro ao buscar pagamentos:", fetchError);
      setPayments([]); // Limpa em caso de erro
      throw fetchError; // Lança o erro para quem chamar a função poder tratar
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // --- Funções de Escrita (CRUD: Create, Update, Delete) ---

  /**
   * Cria um novo registro de pagamento.
   */
  const createPayment = useCallback(
    async (data: Omit<Payment, "id" | "userId">) => {
      setLoading(true);
      setError(null);
      try {
        // Adiciona o userId automaticamente
        const newPaymentData = { ...data, userId };
        await paymentService.create(newPaymentData);
        // Opcional: Atualizar o estado local chamando fetchPayments()
        // ou adicionando o item à lista localmente para otimizar (mas aqui, vamos re-buscar)
        await fetchPayments();
      } catch (err) {
        const createError = err as Error;
        setError(createError);
        console.error("Erro ao criar pagamento:", createError);
        throw createError;
      } finally {
        setLoading(false);
      }
    },
    [userId, fetchPayments]
  );

  /**
   * Atualiza um registro de pagamento existente.
   */
  const updatePayment = useCallback(
    async (paymentId: string, data: Partial<Payment>) => {
      setLoading(true);
      setError(null);
      try {
        await paymentService.update(paymentId, data);
        // Otimização: Atualiza o estado local diretamente
        setPayments((prev) =>
          prev.map((p) => (p.id === paymentId ? { ...p, ...data } : p))
        );
      } catch (err) {
        const updateError = err as Error;
        setError(updateError);
        console.error("Erro ao atualizar pagamento:", updateError);
        throw updateError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Deleta um registro de pagamento.
   */
  const deletePayment = useCallback(
    async (paymentId: string) => {
      setLoading(true);
      setError(null);
      try {
        await paymentService.delete(paymentId);
        // Otimização: Remove do estado local
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      } catch (err) {
        const deleteError = err as Error;
        setError(deleteError);
        console.error("Erro ao deletar pagamento:", deleteError);
        throw deleteError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Retorna um objeto memorizado com todos os estados e funções
  return useMemo(
    () => ({
      payments,
      loading,
      error,
      fetchPayments,
      createPayment,
      updatePayment,
      deletePayment,
    }),
    [payments, loading, error, fetchPayments, createPayment, updatePayment, deletePayment]
  );
};