import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null; // Corrigé en 'username' pour ne plus bloquer Netlify
  dbUser: string;
  dbPass: string;
  fetchDbCredentials: () => Promise<void>;
  login: (u: string, p: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  // On retire le localStorage pour revenir à l'ancien système (déconnexion au rafraîchissement)
  isAuthenticated: false,
  username: null,
  
  dbUser: "admin", 
  dbPass: "rentify", 

  fetchDbCredentials: async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) {
        set({ 
          dbUser: data.settings.adminUsername || "admin", 
          dbPass: data.settings.adminPassword || "rentify" 
        });
      }
    } catch (e) {}
  },

  login: (u, p) => {
    const { dbUser, dbPass } = get();
    if (u === dbUser && p === dbPass) {
      set({ isAuthenticated: true, username: u });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false, username: null });
  },
}));

if (typeof window !== "undefined") {
  useAuth.getState().fetchDbCredentials();
}