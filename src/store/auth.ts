import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
  // Ces valeurs seront écrasées par la base de données
  dbUser: string;
  dbPass: string;
  fetchDbCredentials: () => Promise<void>;
  login: (u: string, p: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  isAuthenticated: typeof window !== "undefined" ? localStorage.getItem("auth") === "true" : false,
  user: typeof window !== "undefined" ? localStorage.getItem("user") : null,
  
  dbUser: "admin", 
  dbPass: "rentify", 

  // Récupère discrètement les identifiants depuis la Base de Données
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
      console.error("Erreur lors de la récupération des identifiants:", e);
    }
  },

  // La fonction de login reste synchrone pour ne pas casser votre page login !
  login: (username, password) => {
    const { dbUser, dbPass } = get();
    
    // Vérifie contre la Base de Données
    if (username === dbUser && password === dbPass) {
      localStorage.setItem("auth", "true");
      localStorage.setItem("user", username);
      set({ isAuthenticated: true, user: username });
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    set({ isAuthenticated: false, user: null });
  },
}));

// Au chargement du site, on lance la récupération des vrais identifiants
if (typeof window !== "undefined") {
  useAuth.getState().fetchDbCredentials();
}