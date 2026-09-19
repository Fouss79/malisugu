"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { examensApi } from "../../../../../lib/examens";
import ExamenTabs from "./ExamenTabs";

export default function ExamenDetailPage() {
  const params = useParams();

  const [examen, setExamen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const chargerExamen = async () => {
      try {
        setLoading(true);
        setError("");

        const examenId = Number(params?.id);

        if (!examenId) {
          throw new Error("Identifiant de l'examen invalide.");
        }

        console.log("Chargement examen :", examenId);

        const data = await examensApi.get(examenId);

        console.log("Examen chargé :", data);

        setExamen(data);
      } catch (err) {
        console.error("Erreur chargement examen :", err);

        if (err?.response?.status === 403) {
          setError(
            "Accès refusé. Vérifiez que votre session est toujours valide."
          );
        } else if (err?.response?.status === 404) {
          setError("Examen introuvable.");
        } else {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Impossible de charger l'examen."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      chargerExamen();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-slate-500">
            Chargement de l'examen...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Impossible de charger l'examen
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!examen) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">

      {/* En-tête de l'examen */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {examen.nom}
        </h1>

        <p className="text-sm text-slate-500">
          {examen.anneeScolaireNom}

          {examen.dateDebut
            ? ` · à partir du ${examen.dateDebut}`
            : ""}

          {examen.dateFin
            ? ` jusqu'au ${examen.dateFin}`
            : ""}
        </p>
      </div>

      {/* Navigation du module examen */}
      <ExamenTabs
        examenId={examen.id}
        ecoleId={examen.ecoleId}
        anneeScolaireId={examen.anneeScolaireId}
      />

    </div>
  );
}