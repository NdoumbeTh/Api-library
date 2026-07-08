# Guide de Test - Endpoints Swagger

## Configuration
**Base URL**: `http://localhost:3000`
**Documentation**: `http://localhost:3000/api-docs`

### Comptes de test
| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@library.epf | password123 | admin |
| librarian@library.epf | password123 | librarian |
| amadou.student@epf.fr | password123 | member |

### Récupérer le token
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@library.epf","password":"password123"}' | jq -r '.token')
echo "Token: $TOKEN"
```

---

## 1. Authentication

### POST /api/v1/auth/register
**Inscription d'un nouvel utilisateur**

```bash
# Succès (201)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nouveau@epf.fr",
    "password": "password123",
    "first_name": "Nouveau",
    "last_name": "Etudiant"
  }'

# Erreur: Email existe déjà (409)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@library.epf",
    "password": "password123",
    "first_name": "Test",
    "last_name": "Duplicate"
  }'

# Erreur: Champ manquant (400)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "incomplet@epf.fr"}'
```

### POST /api/v1/auth/login
**Connexion utilisateur**

```bash
# Succès (200) - Retourne un token JWT
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@library.epf",
    "password": "password123"
  }'

# Erreur: Identifiants invalides (401)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@library.epf",
    "password": "mauvais_mot_de_passe"
  }'

# Erreur: Utilisateur non trouvé (401)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inexistant@epf.fr",
    "password": "password123"
  }'
```

### GET /api/v1/auth/me
**Profil de l'utilisateur connecté**

```bash
# Succès (200) - Nécessite authentification
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Erreur: Token manquant (401)
curl http://localhost:3000/api/v1/auth/me

# Erreur: Token invalide (401)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token"
```

### PUT /api/v1/auth/profile
**Mise à jour du profil**

```bash
# Succès (200)
curl -X PUT http://localhost:3000/api/v1/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "first_name": "Nouveau Prénom",
    "last_name": "Nouveau Nom",
    "phone": "+221 77 000 00 00"
  }'
```

---

## 2. Books

### GET /api/v1/books
**Lister tous les livres avec pagination et filtres**

```bash
# Succès (200) - Liste complète
curl http://localhost:3000/api/v1/books

# Avec pagination
curl "http://localhost:3000/api/v1/books?page=1&limit=5"

# Recherche full-text
curl "http://localhost:3000/api/v1/books?q=misérables"

# Filtre par genre/catégorie
curl "http://localhost:3000/api/v1/books?genre=Roman"

# Filtre par auteur
curl "http://localhost:3000/api/v1/books?author=Camus"

# Tri
curl "http://localhost:3000/api/v1/books?sort=title&order=DESC"
```

### POST /api/v1/books
**Créer un nouveau livre** (Admin/Librarian)

```bash
# Succès (201)
curl -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Le Petit Prince",
    "isbn": "978-2-07-061275-9",
    "publication_year": 1943,
    "publisher": "Gallimard",
    "language": "Français",
    "page_count": 96,
    "description": "Conte philosophique pour enfants"
  }'

# Erreur: ISBN dupliqué (409)
curl -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Autre Livre",
    "isbn": "978-2-07-040850-4"
  }'

# Erreur: Non autorisé (401) - Sans token
curl -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'

# Erreur: Permission refusée (403) - En tant que member
MEMBER_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"amadou.student@epf.fr","password":"password123"}' | jq -r '.token')

curl -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -d '{"title": "Test"}'
```

### GET /api/v1/books/{id}
**Détails d'un livre avec disponibilité**

```bash
# Récupérer un ID de livre
BOOK_ID=$(curl -s http://localhost:3000/api/v1/books | jq -r '.data[0].id')

# Succès (200)
curl http://localhost:3000/api/v1/books/$BOOK_ID

# Erreur: Livre non trouvé (404)
curl http://localhost:3000/api/v1/books/00000000-0000-0000-0000-000000000000
```

### PUT /api/v1/books/{id}
**Remplacement complet d'un livre** (Admin/Librarian)

```bash
curl -X PUT http://localhost:3000/api/v1/books/$BOOK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Titre Mis à Jour",
    "isbn": "978-2-07-061275-9",
    "publication_year": 1943,
    "publisher": "Gallimard",
    "language": "Français"
  }'
```

### PATCH /api/v1/books/{id}
**Mise à jour partielle** (Admin/Librarian)

```bash
curl -X PATCH http://localhost:3000/api/v1/books/$BOOK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "description": "Nouvelle description"
  }'
```

### DELETE /api/v1/books/{id}
**Supprimer un livre** (Admin/Librarian)

```bash
# Succès (204)
curl -X DELETE http://localhost:3000/api/v1/books/$BOOK_ID \
  -H "Authorization: Bearer $TOKEN"

# Erreur: Livre avec exemplaires empruntés (400)
# Essayer de supprimer un livre qui a des emprunts actifs
```

---

## 3. Copies (Exemplaires)

### GET /api/v1/books/{id}/copies
**Lister les exemplaires d'un livre**

```bash
curl http://localhost:3000/api/v1/books/$BOOK_ID/copies
```

### POST /api/v1/books/{bookId}/copies
**Créer un exemplaire** (Admin/Librarian)

```bash
# Succès (201)
curl -X POST http://localhost:3000/api/v1/books/$BOOK_ID/copies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "inventory_number": "COPY-TEST-001",
    "condition": "new",
    "location": "Rayon B"
  }'

# Erreur: Numéro d'inventaire dupliqué (409)
curl -X POST http://localhost:3000/api/v1/books/$BOOK_ID/copies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inventory_number": "COPY-TEST-001"}'
```

### GET /api/v1/books/{bookId}/copies/{copyId}
**Détails d'un exemplaire**

```bash
COPY_ID=$(curl -s http://localhost:3000/api/v1/books/$BOOK_ID/copies | jq -r '.data[0].id')
curl http://localhost:3000/api/v1/books/$BOOK_ID/copies/$COPY_ID
```

### PATCH /api/v1/books/{bookId}/copies/{copyId}
**Mettre à jour un exemplaire** (Admin/Librarian)

```bash
curl -X PATCH http://localhost:3000/api/v1/books/$BOOK_ID/copies/$COPY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "condition": "good",
    "location": "Rayon C"
  }'
```

### DELETE /api/v1/books/{bookId}/copies/{copyId}
**Supprimer un exemplaire** (Admin/Librarian)

```bash
curl -X DELETE http://localhost:3000/api/v1/books/$BOOK_ID/copies/$COPY_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. Authors

### GET /api/v1/authors
**Lister tous les auteurs**

```bash
# Liste complète
curl http://localhost:3000/api/v1/authors

# Avec pagination
curl "http://localhost:3000/api/v1/authors?page=1&limit=5"

# Recherche par nom
curl "http://localhost:3000/api/v1/authors?q=Hugo"
```

### POST /api/v1/authors
**Créer un auteur** (Admin/Librarian)

```bash
curl -X POST http://localhost:3000/api/v1/authors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Amadou Hampâté Bâ",
    "biography": "Écrivain et ethnologue malien",
    "nationality": "Malien",
    "birth_date": "1901-01-01"
  }'
```

### GET /api/v1/authors/{id}
**Détails d'un auteur avec ses livres**

```bash
AUTHOR_ID=$(curl -s http://localhost:3000/api/v1/authors | jq -r '.data[0].id')
curl http://localhost:3000/api/v1/authors/$AUTHOR_ID
```

### PUT /api/v1/authors/{id}
**Remplacement complet** (Admin/Librarian)

```bash
curl -X PUT http://localhost:3000/api/v1/authors/$AUTHOR_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Victor Hugo",
    "biography": "Grand écrivain français",
    "nationality": "Français"
  }'
```

### PATCH /api/v1/authors/{id}
**Mise à jour partielle** (Admin/Librarian)

```bash
curl -X PATCH http://localhost:3000/api/v1/authors/$AUTHOR_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"biography": "Auteur mis à jour"}'
```

### DELETE /api/v1/authors/{id}
**Supprimer un auteur** (Admin/Librarian)

```bash
curl -X DELETE http://localhost:3000/api/v1/authors/$AUTHOR_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Categories

### GET /api/v1/categories
**Lister toutes les catégories**

```bash
curl http://localhost:3000/api/v1/categories
```

### POST /api/v1/categories
**Créer une catégorie** (Admin/Librarian)

```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Essai",
    "description": "Essais littéraires"
  }'

# Erreur: Nom dupliqué (409)
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Roman"}'
```

### GET /api/v1/categories/{id}
**Détails avec livres associés**

```bash
CAT_ID=$(curl -s http://localhost:3000/api/v1/categories | jq -r '.data[0].id')
curl http://localhost:3000/api/v1/categories/$CAT_ID
```

### PUT /api/v1/categories/{id}
**Remplacement** (Admin/Librarian)

```bash
curl -X PUT http://localhost:3000/api/v1/categories/$CAT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Nouvelle Catégorie",
    "description": "Description"
  }'
```

### PATCH /api/v1/categories/{id}
**Mise à jour partielle** (Admin/Librarian)

```bash
curl -X PATCH http://localhost:3000/api/v1/categories/$CAT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"description": "Nouvelle description"}'
```

### DELETE /api/v1/categories/{id}
**Supprimer** (Admin/Librarian)

```bash
curl -X DELETE http://localhost:3000/api/v1/categories/$CAT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Members

### GET /api/v1/members
**Lister tous les adhérents** (Admin/Librarian)

```bash
curl http://localhost:3000/api/v1/members \
  -H "Authorization: Bearer $TOKEN"

# Avec filtres
curl "http://localhost:3000/api/v1/members?status=active" \
  -H "Authorization: Bearer $TOKEN"

curl "http://localhost:3000/api/v1/members?role=member" \
  -H "Authorization: Bearer $TOKEN"

curl "http://localhost:3000/api/v1/members?q=Ba" \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/members
**Créer un adhérent** (Admin)

```bash
curl -X POST http://localhost:3000/api/v1/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "nouveau.membre@epf.fr",
    "password": "password123",
    "first_name": "Nouveau",
    "last_name": "Membre",
    "phone": "+221 77 000 00 00",
    "role": "member"
  }'
```

### GET /api/v1/members/{id}
**Détails d'un adhérent**

```bash
MEMBER_ID=$(curl -s http://localhost:3000/api/v1/members \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl http://localhost:3000/api/v1/members/$MEMBER_ID \
  -H "Authorization: Bearer $TOKEN"
```

### PUT /api/v1/members/{id}
**Remplacement complet**

```bash
curl -X PUT http://localhost:3000/api/v1/members/$MEMBER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "first_name": "Prénom Modifié",
    "last_name": "Nom Modifié",
    "email": "modifier@epf.fr"
  }'
```

### PATCH /api/v1/members/{id}
**Mise à jour partielle**

```bash
curl -X PATCH http://localhost:3000/api/v1/members/$MEMBER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"phone": "+221 77 111 11 11"}'
```

### DELETE /api/v1/members/{id}
**Supprimer** (Admin)

```bash
curl -X DELETE http://localhost:3000/api/v1/members/$MEMBER_ID \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/members/{id}/loans
**Emprunts d'un adhérent**

```bash
curl http://localhost:3000/api/v1/members/$MEMBER_ID/loans \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH /api/v1/members/{id}/suspend
**Suspendre** (Admin/Librarian)

```bash
curl -X PATCH http://localhost:3000/api/v1/members/$MEMBER_ID/suspend \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH /api/v1/members/{id}/activate
**Activer** (Admin/Librarian)

```bash
curl -X PATCH http://localhost:3000/api/v1/members/$MEMBER_ID/activate \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Loans

### GET /api/v1/loans
**Lister tous les emprunts**

```bash
curl http://localhost:3000/api/v1/loans \
  -H "Authorization: Bearer $TOKEN"

# Filtre par statut
curl "http://localhost:3000/api/v1/loans?status=active" \
  -H "Authorization: Bearer $TOKEN"

# Filtre par membre
curl "http://localhost:3000/api/v1/loans?member_id=$MEMBER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/loans
**Créer un emprunt**

```bash
# Récupérer un copy_id disponible
COPY_ID=$(curl -s http://localhost:3000/api/v1/books | \
  jq -r '.data[] | select(.available_copies > 0) | .copies[] | select(.status=="available") | .id' | head -1)

# Succès (201)
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "copy_id": "'$COPY_ID'",
    "member_id": "'$MEMBER_ID'"
  }'

# Erreur 401: Token absent
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -d '{"copy_id": "'$COPY_ID'", "member_id": "'$MEMBER_ID'"}'
# Réponse: {"error":"Authentication required","code":"AUTH_REQUIRED","message":"Token JWT absent ou invalide. Veuillez vous connecter."}

# Erreur 403: Membre suspendu
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"copy_id": "'$COPY_ID'", "member_id": "SUSPENDED_MEMBER_ID"}'
# Réponse: {"error":"Member suspended or inactive","code":"MEMBER_INACTIVE","message":"Votre compte est suspendu ou inactif."}

# Erreur 404: Exemplaire non trouvé
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"copy_id": "00000000-0000-0000-0000-000000000000", "member_id": "'$MEMBER_ID'"}'

# Erreur 409: Exemplaire déjà emprunté
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"copy_id": "'$BORROWED_COPY_ID'", "member_id": "'$MEMBER_ID'"}'

# Erreur 422: Quota dépassé (5 emprunts max)
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"copy_id": "'$COPY_ID'", "member_id": "MEMBER_WITH_5_LOANS"}'
```

### GET /api/v1/loans/overdue
**Emprunts en retard**

```bash
curl http://localhost:3000/api/v1/loans/overdue \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/loans/{id}
**Détails d'un emprunt**

```bash
LOAN_ID=$(curl -s http://localhost:3000/api/v1/loans \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl http://localhost:3000/api/v1/loans/$LOAN_ID \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH /api/v1/loans/{id}/return
**Retourner un livre**

```bash
curl -X PATCH http://localhost:3000/api/v1/loans/$LOAN_ID/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "condition": "good",
    "notes": "Retour en bon état"
  }'

# Retour avec amende (si en retard)
# La réponse inclura: {"fine": {"amount": 3.50, "days_overdue": 7}}
```

### PATCH /api/v1/loans/{id}/renew
**Renouveler un emprunt**

```bash
# Succès (200) - Prolonge de 21 jours
curl -X PATCH http://localhost:3000/api/v1/loans/$LOAN_ID/renew \
  -H "Authorization: Bearer $TOKEN"

# Erreur 400: Déjà renouvelé une fois
curl -X PATCH http://localhost:3000/api/v1/loans/$LOAN_ID/renew \
  -H "Authorization: Bearer $TOKEN"

# Erreur 409: Livre réservé
curl -X PATCH http://localhost:3000/api/v1/loans/$LOAN_ID/renew \
  -H "Authorization: Bearer $TOKEN"
```

---

## 8. Reservations

### GET /api/v1/reservations
**Lister toutes les réservations**

```bash
curl http://localhost:3000/api/v1/reservations \
  -H "Authorization: Bearer $TOKEN"

# Filtres
curl "http://localhost:3000/api/v1/reservations?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/reservations
**Créer une réservation**

```bash
# D'abord trouver un livre non disponible
BOOK_UNAVAIL=$(curl -s http://localhost:3000/api/v1/books | \
  jq -r '.data[] | select(.available_copies == 0) | .id' | head -1)

# Si aucun livre non disponible, emprunter d'abord des exemplaires

curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "book_id": "'$BOOK_UNAVAIL'",
    "member_id": "'$MEMBER_ID'"
  }'

# Erreur 400: Livre disponible
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"book_id": "AVAILABLE_BOOK_ID", "member_id": "'$MEMBER_ID'"}'

# Erreur 409: Déjà réservé par ce membre
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"book_id": "'$BOOK_UNAVAIL'", "member_id": "'$MEMBER_ID'"}'
```

### GET /api/v1/reservations/{id}
**Détails d'une réservation**

```bash
RES_ID=$(curl -s http://localhost:3000/api/v1/reservations \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl http://localhost:3000/api/v1/reservations/$RES_ID \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH /api/v1/reservations/{id}/cancel
**Annuler une réservation**

```bash
curl -X PATCH http://localhost:3000/api/v1/reservations/$RES_ID/cancel \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH /api/v1/reservations/{id}/fulfill
**Satisfaire une réservation** (Admin/Librarian)

```bash
curl -X PATCH http://localhost:3000/api/v1/reservations/$RES_ID/fulfill \
  -H "Authorization: Bearer $TOKEN"
```

### DELETE /api/v1/reservations/{id}
**Supprimer** (Admin/Librarian)

```bash
curl -X DELETE http://localhost:3000/api/v1/reservations/$RES_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 9. Fines

### GET /api/v1/fines
**Lister toutes les amendes** (Admin/Librarian)

```bash
curl http://localhost:3000/api/v1/fines \
  -H "Authorization: Bearer $TOKEN"

# Filtres
curl "http://localhost:3000/api/v1/fines?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/fines
**Créer une amende manuellement** (Admin/Librarian)

```bash
curl -X POST http://localhost:3000/api/v1/fines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "loan_id": "'$LOAN_ID'",
    "amount": 5.00,
    "reason": "Détérioration du livre"
  }'
```

### GET /api/v1/fines/member/{memberId}
**Amendes d'un membre**

```bash
curl http://localhost:3000/api/v1/fines/member/$MEMBER_ID \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/fines/{id}
**Détails d'une amende**

```bash
FINE_ID=$(curl -s http://localhost:3000/api/v1/fines \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

curl http://localhost:3000/api/v1/fines/$FINE_ID \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH /api/v1/fines/{id}/pay
**Payer une amende**

```bash
curl -X PATCH http://localhost:3000/api/v1/fines/$FINE_ID/pay \
  -H "Authorization: Bearer $TOKEN"
```

### PATCH /api/v1/fines/{id}/waive
**Annuler une amende** (Admin)

```bash
curl -X PATCH http://localhost:3000/api/v1/fines/$FINE_ID/waive \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "Erreur technique"}'
```

### DELETE /api/v1/fines/{id}
**Supprimer** (Admin)

```bash
curl -X DELETE http://localhost:3000/api/v1/fines/$FINE_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Codes d'Erreur HTTP

| Code | Signification | Exemple |
|------|---------------|---------|
| 200 | Succès | GET, PUT, PATCH |
| 201 | Créé | POST |
| 204 | Supprimé | DELETE |
| 400 | Requête invalide | JSON malformé, validation échouée |
| 401 | Non authentifié | Token manquant ou invalide |
| 403 | Non autorisé | Permissions insuffisantes |
| 404 | Non trouvé | Ressource inexistante |
| 409 | Conflit | Doublon, état incohérent |
| 422 | Règle métier | Quota dépassé |
| 429 | Rate limit | Trop de requêtes |
| 500 | Erreur serveur | Erreur interne |
| 503 | Service indisponible | Base de données |

---

## Workflow Complet de Test

```bash
#!/bin/bash
# 1. Connexion admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@library.epf","password":"password123"}' | jq -r '.token')

# 2. Créer un livre
BOOK=$(curl -s -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Book","isbn":"978-0-00-000001-8"}')
BOOK_ID=$(echo $BOOK | jq -r '.data.id')

# 3. Ajouter un exemplaire
COPY=$(curl -s -X POST http://localhost:3000/api/v1/books/$BOOK_ID/copies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inventory_number":"TEST-001"}')
COPY_ID=$(echo $COPY | jq -r '.data.id')

# 4. Créer un emprunt
LOAN=$(curl -s -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"copy_id\":\"$COPY_ID\",\"member_id\":\"MEMBER_ID\"}")
LOAN_ID=$(echo $LOAN | jq -r '.data.id')

# 5. Retourner le livre
curl -X PATCH http://localhost:3000/api/v1/loans/$LOAN_ID/return \
  -H "Authorization: Bearer $TOKEN"

# 6. Supprimer le livre
curl -X DELETE http://localhost:3000/api/v1/books/$BOOK_ID \
  -H "Authorization: Bearer $TOKEN"
```
