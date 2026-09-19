import { api } from "./client";

// ⚠️ ADAPTER : je n'ai pas vu le contrôleur existant qui expose CoefficientMatiere
// (probablement déjà présent puisque l'entité existe). Ajuste l'URL et les query
// params ci-dessous pour qu'ils correspondent à ton endpoint réel.
export interface CoefficientMatiereOption {
  id: number;
  matiereNom: string;
  niveauNom: string;
  serieNom: string | null; // null = toutes séries du niveau
  coefficient: number;
}

export const programmeApi = {
  listCoefficientMatieres: (ecoleId: number, anneeScolaireId: number) =>
    api
      .get<CoefficientMatiereOption[]>("/api/coefficient-matieres", {
        params: { ecoleId, anneeScolaireId },
      })
      .then((r) => r.data),
};
