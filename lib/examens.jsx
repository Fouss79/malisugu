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

  listPourNiveauEtSerie: (
    ecoleId,
    anneeScolaireId,
    niveauId,
    serieId
  ) =>
    api
      .get("/coefficients/programme/niveau-serie", {
        params: {
          ecoleId,
          anneeScolaireId,
          niveauId,
          ...(serieId != null ? { serieId } : {}),
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
// SALLES DE L'ÉCOLE
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
// SALLES DE L'EXAMEN
// ============================================================

export const examenSallesApi = {
  /**
   * Liste les salles sélectionnées pour l'examen.
   */
  list: (examenId) =>
    api
      .get(`/examens/${examenId}/salles`)
      .then((r) => r.data),

  /**
   * Affecte une salle à l'examen.
   */
  affecter: (examenId, salleId) =>
    api
      .post(`/examens/${examenId}/salles/${salleId}`)
      .then((r) => r.data),

  /**
   * Retire une salle de l'examen.
   */
  retirer: (examenId, salleId) =>
    api.delete(
      `/examens/${examenId}/salles/${salleId}`
    ),
};

export const compositionEpreuveApi = {
  list: (epreuveId) =>
    api.get(`/epreuves/${epreuveId}/compositions`).then((r) => r.data),

  modifierStatut: (epreuveId, inscriptionId, statut) =>
    api.patch(
      `/epreuves/${epreuveId}/eleves/${inscriptionId}/composition`,
      { statut }
    ).then((r) => r.data),

  remettreNonConfirme: (epreuveId, inscriptionId) =>
    api.delete(
      `/epreuves/${epreuveId}/eleves/${inscriptionId}/composition`
    ),
};


// ============================================================
// RÉPARTITION DE L'EXAMEN
// ============================================================

export const repartitionExamenApi = {
  /**
   * Liste tous les élèves concernés par l'examen.
   */
  getEleves: (examenId) =>
    api
      .get(`/examens/${examenId}/eleves`)
      .then((r) => r.data),

  /**
   * Génère automatiquement la répartition
   * élève → salle pour tout l'examen.
   */
  repartir: (examenId) =>
    api
      .post(`/examens/${examenId}/repartition`)
      .then((r) => r.data),

  /**
   * Récupère la répartition complète.
   */
  getRepartition: (examenId) =>
    api
      .get(`/examens/${examenId}/repartition`)
      .then((r) => r.data),

  /**
   * Récupère la répartition groupée par salle.
   */
  getParSalle: (examenId) =>
    api
      .get(
        `/examens/${examenId}/repartition/par-salle`
      )
      .then((r) => r.data),

  /**
   * Récupère uniquement les élèves concernés
   * par une épreuve donnée.
   */
  getParEpreuve: (examenId, epreuveId) =>
    api
      .get(
        `/examens/${examenId}/epreuves/${epreuveId}/repartition`
      )
      .then((r) => r.data),

  /**
   * Supprime toute la répartition de l'examen.
   */
  supprimer: (examenId) =>
    api.delete(
      `/examens/${examenId}/repartition`
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