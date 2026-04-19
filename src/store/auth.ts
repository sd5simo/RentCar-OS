import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null; // <-- Défini correctement ici
  dbUser: string;
  dbPass: string;
  fetchDbCredentials: () => Promise<void>;
  login: (u: string, p: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
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
    } catch (e) {
      console.error("Erreur lors de la récupération des identifiants", e);
    }
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