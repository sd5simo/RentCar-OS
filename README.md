# 🚗 Rentify-OS — Admin Platform

Gestion interne de location de voitures · Next.js 14 · Prisma · PostgreSQL (Supabase)

---

## 🚀 Démarrage rapide

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer la base de données

Copier `.env.example` → `.env` et remplir vos URLs Supabase :

```bash
cp .env.example .env
```

Dans votre projet Supabase → **Settings → Database → Connection string** :

| Variable | URL Supabase | Port |
|---|---|---|
| `DATABASE_URL` | Transaction pooler | 6543 |
| `DIRECT_URL` | Direct connection | 5432 |

### 3. Initialiser la base de données
```bash
# Créer les tables
npx prisma migrate deploy

# OU pour un environnement de développement :
npx prisma db push

# (Optionnel) Insérer les données de démonstration
npm run db:seed
```

### 4. Lancer le serveur
```bash
npm run dev
```

Ouvrir http://localhost:3000

**Identifiants** : `admin` / `Rentify-OS2026v1`

---

## 🏗️ Déploiement Netlify

### Build settings
- **Build command** : `npx prisma generate && next build`
- **Publish directory** : `.next`

### Variables d'environnement (Netlify Dashboard → Environment variables)
```
DATABASE_URL=postgresql://...pooler...6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...db...5432/postgres
```

---

## 📁 Architecture API

| Route | Méthodes | Description |
|---|---|---|
| `/api/clients` | GET, POST | Liste + création |
| `/api/clients/[id]` | GET, PUT, DELETE | Détail + mise à jour + suppression |
| `/api/vehicles` | GET, POST | Flotte |
| `/api/vehicles/[id]` | GET, PUT, DELETE | Véhicule individuel |
| `/api/rentals` | GET, POST | Locations (POST = marque véhicule RENTED) |
| `/api/rentals/[id]` | GET, PUT, DELETE | PUT COMPLETED = marque véhicule AVAILABLE |
| `/api/reservations` | GET, POST | Réservations |
| `/api/reservations/[id]` | GET, PUT, DELETE | |
| `/api/expenses` | GET, POST | Dépenses |
| `/api/expenses/[id]` | PUT, DELETE | |
| `/api/infractions` | GET, POST | Infractions |
| `/api/infractions/[id]` | PUT, DELETE | |
| `/api/damages` | POST | Signaler un dommage |
| `/api/damages/[id]` | PUT, DELETE | Marquer réparé |

---

## 🔐 Sécurité

Les identifiants de démonstration sont dans `src/store/auth.ts`.
Pour la production, remplacer par NextAuth.js avec une vraie table d'utilisateurs.
