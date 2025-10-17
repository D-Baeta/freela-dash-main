import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  DocumentSnapshot,
  WriteBatch,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase-config";
import { z, ZodTypeAny } from "zod";

export abstract class BaseService<T extends { id?: string }> {
  protected abstract collectionName: string;
  protected abstract schema: z.ZodSchema<T>;

  protected get collection() {
    return collection(db, this.collectionName);
  }

  protected validateData(data: unknown): T {
    try {
      return this.schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new Error(`Validation error: ${errorMessages}`);
      }
      throw error;
    }
  }

  protected handleFirestoreError(error: unknown, operation: string): never {
    console.error(`Firestore error during ${operation}:`, error);
    
    if (error instanceof Error) {
      // Handle specific Firestore errors
      if (error.message.includes('permission-denied')) {
        throw new Error('Você não tem permissão para realizar esta operação');
      }
      if (error.message.includes('not-found')) {
        throw new Error('Recurso não encontrado');
      }
      if (error.message.includes('already-exists')) {
        throw new Error('Este recurso já existe');
      }
    }
    
    throw new Error(`Erro ao ${operation}. Tente novamente mais tarde.`);
  }

  async create(data: Omit<T, "id">): Promise<string> {
    try {
      const validatedData = this.validateData(data);
      const docRef = await addDoc(this.collection, {
        ...validatedData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      this.handleFirestoreError(error, 'criar');
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = { id: docSnap.id, ...docSnap.data() } as T;
      return this.validateData(data);
    } catch (error) {
      this.handleFirestoreError(error, 'buscar');
    }
  }

  async getAllByUser(userId: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(
        this.collection,
        where("userId", "==", userId),
        ...constraints
      );
      
      const querySnapshot = await getDocs(q);
      const results: T[] = [];
      
      querySnapshot.forEach((doc) => {
        try {
          const data = { id: doc.id, ...doc.data() } as T;
          const validatedData = this.validateData(data);
          results.push(validatedData);
        } catch (validationError) {
          console.warn(`Skipping invalid document ${doc.id}:`, validationError);
        }
      });
      
      return results;
    } catch (error) {
      this.handleFirestoreError(error, 'buscar');
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const updateData = { ...data }; // don't validate the whole schema
      delete updateData.id;

      if (Object.keys(updateData).length === 0) {
        throw new Error('Nenhum dado válido para atualizar');
      }

      const docRef = doc(this.collection, id);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      this.handleFirestoreError(error, 'atualizar');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(this.collection, id);
      await deleteDoc(docRef);
    } catch (error) {
      this.handleFirestoreError(error, 'deletar');
    }
  }

  async batchCreate(items: Omit<T, "id">[]): Promise<string[]> {
    try {
      if (items.length === 0) {
        return [];
      }
      
      const batch = writeBatch(db);
      const ids: string[] = [];
      
      items.forEach((item) => {
        const validatedData = this.validateData(item);
        const docRef = doc(this.collection);
        batch.set(docRef, {
          ...validatedData,
          createdAt: serverTimestamp(),
        });
        ids.push(docRef.id);
      });
      
      await batch.commit();
      return ids;
    } catch (error) {
      this.handleFirestoreError(error, 'criar em lote');
    }
  }

  async batchUpdate(updates: { id: string; data: Partial<T> }[]): Promise<void> {
    try {
      if (updates.length === 0) {
        return;
      }
      
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        const validatedData = this.validateData(data);
        const docRef = doc(this.collection, id);
        
        const updateData = Object.fromEntries(
          Object.entries(validatedData).filter(([_, value]) => value !== undefined)
        );
        delete updateData.id;
        
        if (Object.keys(updateData).length > 0) {
          batch.update(docRef, {
            ...updateData,
            updatedAt: serverTimestamp(),
          });
        }
      });
      
      await batch.commit();
    } catch (error) {
      this.handleFirestoreError(error, 'atualizar em lote');
    }
  }

  async batchDelete(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) {
        return;
      }
      
      const batch = writeBatch(db);
      
      ids.forEach((id) => {
        const docRef = doc(this.collection, id);
        batch.delete(docRef);
      });
      
      await batch.commit();
    } catch (error) {
      this.handleFirestoreError(error, 'deletar em lote');
    }
  }
}
