// Types miroir des DTO Spring Boot (com.saas.school.dto.examen.*)

export type StatutExamen = "PLANIFIE" | "EN_COURS" | "TERMINE";
export type RoleEpreuve = "SURVEILLANT" | "CORRECTEUR" | "RESPONSABLE";

export interface Examen {
  id: number;
  nom: string;
  ecoleId: number;
  anneeScolaireId: number;
  anneeScolaireNom: string;
  dateDebut: string | null; // ISO yyyy-MM-dd
  dateFin: string | null;
  statut: StatutExamen;
  createdAt: string;
}

export interface ExamenRequest {
  nom: string;
  ecoleId: number;
  anneeScolaireId: number;
  dateDebut?: string | null;
  dateFin?: string | null;
}

export interface CreneauExamen {
  id: number;
  examenId: number;
  date: string; // yyyy-MM-dd
  heureDebut: string; // HH:mm:ss
  heureFin: string;
}

export interface CreneauExamenRequest {
  examenId: number;
  date: string;
  heureDebut: string;
  heureFin: string;
}

export interface EpreuveExamen {
  id: number;
  examenId: number;
  coefficientMatiereId: number;
  matiereNom: string;
  coefficient: number;
  niveauNom: string;
  serieNom: string | null;
  creneauId: number | null;
  creneauDate: string | null;
  creneauHeureDebut: string | null;
  creneauHeureFin: string | null;
  dureeMinutes: number | null;
}

export interface EpreuveExamenRequest {
  examenId: number;
  coefficientMatiereId: number;
  creneauId?: number | null;
  dureeMinutes?: number | null;
}

export interface Salle {
  id: number;
  nom: string;
  capacite: number;
  active: boolean;
  ecoleId: number;
}

export interface SalleRequest {
  nom: string;
  capacite: number;
  ecoleId: number;
  active?: boolean;
}

export interface EpreuveEnseignant {
  id: number;
  epreuveId: number;
  enseignantId: number;
  enseignantNomComplet: string;
  role: RoleEpreuve | null;
}

export interface EpreuveEnseignantRequest {
  epreuveId: number;
  enseignantId: number;
  role?: RoleEpreuve | null;
}

export interface SalleRepartitionApercu {
  salleId: number;
  salleNom: string;
  capacite: number;
  nombreElevesPrevu: number;
}

export interface RepartitionPreview {
  examenId: number;
  nombreEleves: number;
  capaciteTotale: number;
  nombreSalles: number;
  capaciteSuffisante: boolean;
  repartitionPrevue: SalleRepartitionApercu[];
}

export interface RepartitionResult {
  examenId: number;
  nombreElevesAffectes: number;
  repartitionParSalle: SalleRepartitionApercu[];
}

export interface AffectationEleveExamen {
  id: number;
  examenId: number;
  inscriptionId: number;
  eleveNomComplet: string;
  classeNom: string;
  salleId: number;
  salleNom: string;
  numeroPlace: number;
}

// Erreur métier renvoyée par ExamenExceptionHandler (HTTP 400)
export interface ErreurMetier {
  timestamp: string;
  status: number;
  error: string;
  message: string;
}
