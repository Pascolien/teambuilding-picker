# 🎯 Team Building Picker – Choisissez votre activité !

Bienvenue sur **Team Building Picker**, une application simple et interactive pour permettre à une équipe de **voter en temps réel** pour choisir l’activité idéale de team building.  
Accessible depuis un navigateur, elle affiche les résultats instantanément à tous les participants.

---

## 🌟 Fonctionnalités principales

✅ **Votez** pour une ou plusieurs activités proposées  
✅ **Voyez les résultats en direct**, mis à jour automatiquement  
✅ **Ajoutez** vos propres idées d’activités  
✅ **Supprimez** une activité si elle n’est plus d’actualité  
✅ **Réinitialisez vos votes** en un clic  
✅ **Compatible mobile et ordinateur**

---

## 📸 Aperçu rapide

L’application affiche :
- Une **liste d’activités** (titre, description, tags, lien, votes)
- Une **barre de progression en temps réel** pour visualiser les résultats
- Un **indicateur “En tête”** pour les activités les plus votées
- Une **interface responsive** adaptée aux écrans de téléphone, tablette et PC

---

## 🚀 Comment utiliser l’application

1. **Ouvrez la page du sondage** (exemple : [https://tonapp.netlify.app](https://tonapp.netlify.app))  
2. Parcourez la liste des activités proposées  
3. Cliquez sur **“Voter”** pour exprimer votre choix  
4. Vous pouvez voter pour **plusieurs activités**  
5. Le bouton devient **vert “Mon choix”** pour indiquer votre sélection  
6. Cliquez à nouveau pour **retirer votre vote**  
7. Les résultats évoluent **en direct** pour tous les utilisateurs

---

## 🧩 Ajout d’une activité

1. Cliquez sur **“➕ Ajouter une activité”**  
2. Renseignez :
   - Le **titre**
   - Une **description**
   - Les **tags** (ex : sportif, plein air)
   - Un **lien externe** (facultatif)
3. L’activité s’affiche immédiatement dans la liste et devient disponible au vote.

---

## 🔄 Réinitialiser vos votes

Cliquez sur **“Retirer mes votes”** pour remettre tous vos choix à zéro.  
Cette action supprime uniquement vos votes, sans impacter ceux des autres.

---

## 📊 Page “Résultats”

Cliquez sur le bouton **“Résultats”** dans le menu pour accéder à la page dédiée.  
Elle affiche :
- Le **classement complet**
- Le **nombre de votes** par activité
- Le **total global**
- Les **liens directs** vers les activités

Les résultats se mettent à jour automatiquement à chaque vote.

---

## 📱 Utilisation sur mobile

L’application est **optimisée pour tous les écrans** :
- Grille flexible (1 à 4 colonnes)
- Boutons tactiles ergonomiques
- Texte lisible et compact
- Interface fluide et réactive

---

## ❓ FAQ

### 🧩 “Mon vote n’apparaît pas immédiatement”
> Vérifiez votre connexion Internet. Si le problème persiste, rechargez la page — vos votes sont sauvegardés côté serveur.

### 🧹 “J’ai ajouté une activité par erreur”
> Cliquez sur l’icône 🗑️ pour la supprimer.

### 🔁 “Les chiffres ne bougent pas chez mes collègues”
> Vérifiez que **le temps réel est actif** (affiché en haut de la page).

---

# ⚙️ Section Développeur

Cette section est destinée aux développeurs qui souhaitent **installer**, **exécuter** ou **contribuer** au projet.

---

## 🧠 Stack technique

| Technologie | Rôle |
|--------------|------|
| ⚛️ **React 18 + Vite** | Frontend rapide et modulaire |
| 🧩 **TypeScript** | Typage fort et sécurité |
| 🎨 **TailwindCSS** | Style moderne et responsive |
| 🗄️ **Supabase** | Base de données PostgreSQL + Realtime |
| ⚡ **Netlify** | Déploiement continu front-end |

---

## 📁 Structure du projet

teambuilding-picker/
├── client/

│ ├── src/

│ │ ├── components/ # Composants UI

│ │ │ ├── AddActivityButton.tsx

│ │ │ ├── VoteProgressBar.tsx

│ │ ├── lib/

│ │ │ ├── supabase.ts # Initialisation du client Supabase

│ │ │ ├── apiSupabase.ts # Appels CRUD (activities, votes)

│ │ ├── pages/

│ │ │ ├── Poll.tsx # Page principale (votes)

│ │ │ ├── Results.tsx # Page des résultats

│ │ ├── types.ts # Interfaces TypeScript

│ │ ├── App.tsx, main.tsx # Entrées React

│ ├── .env.local # Variables d’environnement

│ ├── package.json

│ └── vite.config.ts

└── server/ # Optionnel : serveur supplémentaire

---

## 🧩 Base de données Supabase

### Table `activities`
| Colonne | Type | Description |
|----------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| title | text | Nom de l’activité |
| description | text | Détails |
| tags | text[] | Mots-clés |
| url | text | Lien externe |
| votes_count | int | Nombre de votes |
| created_at | timestamptz | Date de création |

### Table `votes`
| Colonne | Type | Description |
|----------|------|-------------|
| id | uuid (PK) | Identifiant |
| client_id | text | Identifiant anonyme utilisateur |
| activity_id | uuid | Référence à `activities.id` |
| created_at | timestamptz | Date du vote |

**Index unique :**
```sql
create unique index if not exists ux_votes_client_activity
  on public.votes (client_id, activity_id);
##🔄 Triggers SQL

create or replace function public.sync_votes_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.activities
    set votes_count = coalesce(votes_count, 0) + 1
    where id = new.activity_id;
  elsif (tg_op = 'DELETE') then
    update public.activities
    set votes_count = greatest(coalesce(votes_count, 0) - 1, 0)
    where id = old.activity_id;
  end if;
  return null;
end;
$$;

create trigger trg_votes_insert
after insert on public.votes
for each row execute function public.sync_votes_count();

create trigger trg_votes_delete
after delete on public.votes
for each row execute function public.sync_votes_count();

## 🔐 Policies (RLS)

Active le Row Level Security dans Supabase et ajoute :

-- activities
create policy "Public read activities" on public.activities
for select using (true);

create policy "Public insert activities" on public.activities
for insert with check (true);

create policy "Public delete activities" on public.activities
for delete using (true);

-- votes
create policy "Public read votes" on public.votes
for select using (true);

create policy "Public insert votes" on public.votes
for insert with check (true);

create policy "Public delete votes" on public.votes
for delete using (true);

