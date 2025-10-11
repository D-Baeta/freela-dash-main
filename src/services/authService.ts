import { auth, db } from "./firebase-config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { User } from "../types/models";

// Interface for registration inputs
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  profession: string;
}

// Login input type
export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  /** Register a new user and create their Firestore profile */
  async registerUser({ email, password, name, profession }: RegisterData): Promise<FirebaseUser> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, "users", user.uid);

    const userData: Omit<User, "id" | "createdAt"> = {
      name,
      email,
      profession,
      plan: "free",
    };

    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });

    return user;
  },

  /** Log in an existing user */
  loginUser({ email, password }: LoginData) {
    return signInWithEmailAndPassword(auth, email, password);
  },

  /** Log out the current user */
  logoutUser() {
    return signOut(auth);
  },
};
