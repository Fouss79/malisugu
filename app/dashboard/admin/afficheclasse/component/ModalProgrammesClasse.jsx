"use client";

import { useEffect, useState } from "react";
import {
  X,
  BookOpen,
  Clock,
  Pencil,
  Plus,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import api from "../../../../../lib/api";

export default function ModalProgrammesClasse({
  classe,
  ecoleId,
  anneeScolaireId,
  onClose,
  onAjouter,
  onModifier,
}){
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  /* =========================================================
     CHARGER PROGRAMMES
  ========================================================= */

  useEffect(() => {
    if (!classe?.id || !anneeScolaireId) {
      return;
    }

    let actif = true;

    const chargerProgrammes = async () => {
      try {
        setLoading(true);
        setErreur("");

        const niveauId =
          classe.niveauId ||
          classe.niveau?.id;

        if (!niveauId) {
          setErreur(
            "Le niveau de cette classe n'est pas renseigné."
          );

          setProgrammes([]);
          return;
        }

        const params = {
  ecoleId: Number(ecoleId),
  anneeScolaireId: Number(anneeScolaireId),
  niveauId: Number(niveauId),
  classeId: Number(classe.id),
};

        console.log(
          "📚 Chargement programmes classe :",
          params
        );
          console.log("📚 PARAMÈTRES PROGRAMMES =", {
  ecoleId,
  anneeScolaireId,
  niveauId,
  classeId: classe.id,
});

console.log(
  "📚 URL PROGRAMMES =",
  "/coefficients/programme/classe"
);
        const response = await api.get(
          "/coefficients/programme/classe",
          { params }
        );

        const liste =
          Array.isArray(response.data)
            ? response.data
            : [];

        if (!actif) return;

        console.log(
          "📚 Programmes de la classe :",
          liste
        );

        setProgrammes(liste);

      } catch (error) {
        if (!actif) return;

        console.error(
          "❌ Erreur chargement programmes :",
          error
        );

        console.error(
          "Status :",
          error.response?.status
        );

        console.error(
          "Data :",
          error.response?.data
        );

        setProgrammes([]);

        setErreur(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Impossible de charger les programmes."
        );

      } finally {
        if (actif) {
          setLoading(false);
        }
      }
    };

    chargerProgrammes();

    return () => {
      actif = false;
    };
  },[classe, ecoleId, anneeScolaireId]);

  /* =========================================================
     RENDU
  ========================================================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        {/* =====================================================
    HEADER
===================================================== */}

<div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

  <div className="flex items-center gap-3">

    <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
      <BookOpen size={22} />
    </div>

    <div>
      <h2 className="text-lg font-semibold text-slate-800">
        Programmes de la classe
      </h2>

      <p className="mt-0.5 text-sm text-slate-500">
        {classe?.nomComplet || classe?.nom}
      </p>
    </div>

  </div>

  <div className="flex items-center gap-2">

    {/* AJOUTER PROGRAMME */}
    <button
      type="button"
      onClick={() => onAjouter?.()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
    >
      <Plus size={16} />
      Ajouter
    </button>

    {/* FERMER */}
    <button
      type="button"
      onClick={onClose}
      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      title="Fermer"
    >
      <X size={20} />
    </button>

  </div>

</div>

        {/* =====================================================
            CONTENU
        ===================================================== */}

        <div className="flex-1 overflow-y-auto p-5">

          {/* LOADING */}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">

              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

              <p className="text-sm text-slate-500">
                Chargement des programmes...
              </p>

            </div>
          )}

          {/* ERREUR */}

          {!loading && erreur && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {erreur}
            </div>
          )}

          {/* AUCUN PROGRAMME */}

          
                 {/* AUCUN PROGRAMME */}

{!loading &&
  !erreur &&
  programmes.length === 0 && (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">

      <BookOpen
        size={40}
        className="mb-3 text-slate-300"
      />

      <p className="font-medium text-slate-600">
        Aucun programme
      </p>

      <p className="mt-1 text-sm text-slate-400">
        Aucun programme n'est configuré
        pour cette classe.
      </p>

    </div>
  )}

          {/* PROGRAMMES */}

          {!loading &&
            !erreur &&
            programmes.length > 0 && (

              <div className="space-y-3">

                {programmes.map(
                  (programme) => {

                    const matiereNom =
                      programme.matiereNom ||
                      programme.matiere?.nom ||
                      "Matière";

                    const niveauNom =
                      programme.niveauNom ||
                      programme.niveau?.nom;

                    const serieNom =
                      programme.serieNom ||
                      programme.serie?.nom;

                    const sousGroupeNom =
                      programme.sousGroupeNom ||
                      programme.sousGroupe?.nom;

                    const coefficient =
                      programme.coefficient ??
                      "-";

                    const heures =
                      programme.nombreHeuresParSemaine ??
                      programme.volumeHoraire ??
                      programme.heuresParSemaine;

                    return (
                      <div
                        key={programme.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
                      >

                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                          {/* INFOS */}

                          <div className="flex items-start gap-3">

                            <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                              <BookOpen size={20} />
                            </div>

                            <div>

                              <h3 className="font-semibold text-slate-800">
                                {matiereNom}
                              </h3>

                              <div className="mt-2 flex flex-wrap gap-1.5">

                                {niveauNom && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                    <GraduationCap
                                      size={12}
                                    />
                                    {niveauNom}
                                  </span>
                                )}

                                {serieNom && (
                                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                                    Série {serieNom}
                                  </span>
                                )}

                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                  Coeff. {coefficient}
                                </span>

                                {heures && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                                    <Clock size={12} />
                                    {heures}h/semaine
                                  </span>
                                )}

                                {sousGroupeNom && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                    <UsersRound
                                      size={12}
                                    />
                                    {sousGroupeNom}
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>

                          {/* ACTIONS */}

                          <div className="flex shrink-0">

  <button
    type="button"
    onClick={() =>
      onModifier?.(programme)
    }
    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
  >
    <Pencil size={14} />
    Modifier
  </button>

</div>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">

          <p className="text-xs text-slate-400">
            {programmes.length} programme
            {programmes.length > 1 ? "s" : ""}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Fermer
          </button>

        </div>

      </div>
    </div>
  );
}