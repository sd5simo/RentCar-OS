import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  credentials: Record<string, string>;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updatePassword: (user: string, newPass: string) => void;
}

const DEFAULT_CREDENTIALS: Record<string, string> = {
  admin: "rentify",
  manager: "carayou123",
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      username: null,
      credentials: DEFAULT_CREDENTIALS,
      
      login: (username, password) => {
        if (!username || !password) return false;
        
        const cleanUser = username.trim().toLowerCase();
        const cleanPass = password.trim();
        const currentCreds = get().credentials || DEFAULT_CREDENTIALS;

        if (currentCreds[cleanUser] === cleanPass) {
          set({ isAuthenticated: true, username: cleanUser });
          return true;
        }
        return false;
      },
      
      logout: () => set({ isAuthenticated: false, username: null }),
      
      updatePassword: (user, newPass) => set((state) => ({
        credentials: { ...(state.credentials || DEFAULT_CREDENTIALS), [user]: newPass }
      })),
    }),
    { 
      name: "kharrazi-auth",
      // MAGIE : On dit au navigateur de ne sauvegarder QUE les mots de passe.
      // Au rafraîchissement, "isAuthenticated" redevient "false", donc ça déconnecte !
      partialize: (state) => ({ credentials: state.credentials }),
    }
  )
);