import { api } from "./client";

// ============================================================
// EXAMENS
// ============================================================

export const examensApi = {
  create: (data) =>
    api.post("/examens", data).then((r) => r.data),

  update: (id, data) =>
    api.put(`/examens/${id}`, data).then((r) => r.data),

  remove: (id) =>
    api.delete(`/examens/${id}`),

  get: (id) =>
    api.get(`/examens/${id}`).then((r) => r.data),

  listByEcole: (ecoleId) =>
    api
      .get(`/examens/ecole/${ecoleId}`)
      .then((r) => r.data),

  listByEcoleAndAnnee: (ecoleId, anneeScolaireId) =>
    api
      .get(
        `/examens/ecole/${ecoleId}/annee/${anneeScolaireId}`
      )
      .then((r) => r.data),
};


// ============================================================
// COEFFICIENTS / PROGRAMMES
// ============================================================

export const coefficientsApi = {
  listByEcoleAndAnnee: (
    ecoleId,
    anneeScolaireId
  ) =>
    api
      .get(
        `/coefficients/ecole/${ecoleId}/annee/${anneeScolaireId}`
      )
      .then((r) => r.data),

  listPourClasse: (
    ecoleId,
    anneeScolaireId,
    niveauId,
    classeId
  ) =>
    api
      .get("/coefficients/programme/classe", {
        params: {
          ecoleId,
          anneeScolaireId,
          niveauId,
          classeId,
        },
      })
      .then((r) => r.data),
};


// ============================================================
// CRÉNEAUX
// ============================================================

export const creneauxApi = {
  create: (data) =>
    api
      .post("/creneaux", data)
      .then((r) => r.data),

  update: (id, data) =>
    api
      .put(`/creneaux/${id}`, data)
      .then((r) => r.data),

  remove: (id) =>
    api.delete(`/creneaux/${id}`),

  listByExamen: (examenId) =>
    api
      .get(`/examens/${examenId}/creneaux`)
      .then((r) => r.data),
};


// ============================================================
// ÉPREUVES
// ============================================================

export const epreuvesApi = {
  add: (data) =>
    api
      .post("/epreuves", data)
      .then((r) => r.data),

  update: (id, data) =>
    api
      .put(`/epreuves/${id}`, data)
      .then((r) => r.data),

  remove: (id) =>
    api.delete(`/epreuves/${id}`),

  listByExamen: (examenId) =>
    api
      .get(`/examens/${examenId}/epreuves`)
      .then((r) => r.data),
};


// ============================================================
// SALLES
// ============================================================

export const sallesApi = {
  create: (data) =>
    api
      .post("/salles", data)
      .then((r) => r.data),

  update: (id, data) =>
    api
      .put(`/salles/${id}`, data)
      .then((r) => r.data),

  remove: (id) =>
    api.delete(`/salles/${id}`),

  listByEcole: (ecoleId) =>
    api
      .get(`/salles/ecole/${ecoleId}`)
      .then((r) => r.data),

  changerStatut: (id, active) =>
    api
      .patch(`/salles/${id}/active`, null, {
        params: {
          active,
        },
      })
      .then((r) => r.data),
};


// ============================================================
// SALLES AFFECTÉES À UNE ÉPREUVE
// ============================================================

export const epreuveSallesApi = {
  listByEpreuve: (epreuveId) =>
    api
      .get(`/epreuves/${epreuveId}/salles`)
      .then((r) => r.data),

  affecter: (epreuveId, salleId) =>
    api
      .post(
        `/epreuves/${epreuveId}/salles/${salleId}`
      )
      .then((r) => r.data),

  retirer: (epreuveId, salleId) =>
    api.delete(
      `/epreuves/${epreuveId}/salles/${salleId}`
    ),
};


// ============================================================
// RÉPARTITION DES ÉLÈVES PAR ÉPREUVE
// ============================================================

export const repartitionEpreuvesApi = {
  /**
   * Élèves concernés par une épreuve
   *
   * Epreuve
   *   ↓
   * CoefficientMatiere
   *   ↓
   * Classe
   *   ↓
   * Inscriptions
   *   ↓
   * Élèves compatibles avec le sous-groupe
   */
  getEleves: (epreuveId) =>
    api
      .get(`/epreuves/${epreuveId}/eleves`)
      .then((r) => r.data),

  /**
   * Génère automatiquement la répartition
   * des élèves dans les salles de l'épreuve.
   */
  repartir: (epreuveId) =>
    api
      .post(`/epreuves/${epreuveId}/repartition`)
      .then((r) => r.data),

  /**
   * Récupère la répartition existante.
   */
  getRepartition: (epreuveId) =>
    api
      .get(`/epreuves/${epreuveId}/repartition`)
      .then((r) => r.data),

  /**
   * Supprime la répartition d'une épreuve.
   */
  supprimer: (epreuveId) =>
    api.delete(
      `/epreuves/${epreuveId}/repartition`
    ),
};


// ============================================================
// ENSEIGNANTS D'ÉPREUVE
// ============================================================

export const epreuveEnseignantsApi = {
  add: (data) =>
    api
      .post("/epreuve-enseignants", data)
      .then((r) => r.data),

  remove: (id) =>
    api.delete(
      `/epreuve-enseignants/${id}`
    ),

  listByEpreuve: (epreuveId) =>
    api
      .get(
        `/epreuves/${epreuveId}/enseignants`
      )
      .then((r) => r.data),
};