"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../../lib/api";
import {
  Plus,
  Trash2,
  UserRound,
  BookOpen,
  Clock,
  GraduationCap,
  X,
} from "lucide-react";

/* =========================================================
   PAGE
========================================================= */

function AffectationEnseignantFormInner() {
  const { user } = useAuth();
  

  const ecoleId =
  user?.ecoleId ||
  user?.ecole?.id ||
  user?.ecole?.ecoleId;

  /* =======================================================
     STATES
  ======================================================= */

  const [annees, setAnnees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [affectations, setAffectations] = useState([]);

  const [anneeScolaireId, setAnneeScolaireId] = useState("");
  const [classeId, setClasseId] = useState("");

  const [loadingAnnees, setLoadingAnnees] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingProgrammes, setLoadingProgrammes] = useState(false);
  const [loadingAffectations, setLoadingAffectations] = useState(false);

  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState("");

  /* Modal ajout enseignant */
  const [programmeSelectionne, setProgrammeSelectionne] = useState(null);
  const [enseignantsDisponibles, setEnseignantsDisponibles] = useState([]);
  const [loadingEnseignants, setLoadingEnseignants] = useState(false);
  const [ajoutEnCours, setAjoutEnCours] = useState(null);

  /* Suppression */
  const [suppressionEnCours, setSuppressionEnCours] = useState(null);

  /* =======================================================
     UTILITAIRE TOAST
  ======================================================= */

  const afficherToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  /* =======================================================
     1. CHARGER ANNÉES
  ======================================================= */

  useEffect(() => {
  if (!ecoleId) return;

  const chargerAnnees = async () => {
    try {
      setLoadingAnnees(true);
      setErreur("");

      console.log("📅 Chargement années pour école :", ecoleId);

      const res = await api.get(`/annees/ecole/${ecoleId}`);

      console.log("📅 Années reçues :", res.data);

      const liste = Array.isArray(res.data)
        ? res.data
        : [];

      setAnnees(liste);

      if (liste.length === 0) {
        setAnneeScolaireId("");
        setErreur("Aucune année scolaire trouvée.");
        return;
      }

      // Chercher l'année active
      const active = liste.find(
        (a) =>
          a.active === true ||
          a.actif === true ||
          a.statut === "ACTIVE" ||
          a.statut === "ACTIF"
      );

      if (active) {
        console.log("✅ Année active :", active);

        setAnneeScolaireId(String(active.id));
      } else {
        console.log(
          "⚠️ Aucune année active, première année utilisée :",
          liste[0]
        );

        setAnneeScolaireId(String(liste[0].id));
      }
    } catch (error) {
      console.error("❌ Erreur chargement années :", error);
      console.error("Status :", error.response?.status);
      console.error("Data :", error.response?.data);

      setAnnees([]);
      setAnneeScolaireId("");

      setErreur(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Impossible de charger les années scolaires."
      );
    } finally {
      setLoadingAnnees(false);
    }
  };

  chargerAnnees();
}, [ecoleId]);
  /* =======================================================
     2. CHARGER CLASSES
  ======================================================= */

  useEffect(() => {
    if (!ecoleId) return;

    const chargerClasses = async () => {
      try {
        setLoadingClasses(true);

        const res = await api.get(`/classes/ecole/${ecoleId}`);

        setClasses(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Erreur chargement classes :", error);

        setErreur(
          error.response?.data?.message ||
            "Impossible de charger les classes."
        );
      } finally {
        setLoadingClasses(false);
      }
    };

    chargerClasses();
  }, [ecoleId]);

  /* =======================================================
     3. PRÉSELECTION CLASSE DEPUIS URL
  ======================================================= */

  

  /* =======================================================
     CLASSE SÉLECTIONNÉE
  ======================================================= */

  const classeSelectionnee = useMemo(() => {
    return classes.find(
      (c) => String(c.id) === String(classeId)
    );
  }, [classes, classeId]);

  /* =======================================================
     4. CHARGER PROGRAMMES
  ======================================================= */

  useEffect(() => {
    if (!ecoleId || !anneeScolaireId || !classeSelectionnee) {
      setProgrammes([]);
      return;
    }

    const chargerProgrammes = async () => {
      try {
        setLoadingProgrammes(true);
        setErreur("");

        const niveauId =
          classeSelectionnee.niveauId ||
          classeSelectionnee.niveau?.id;

        const serieId =
          classeSelectionnee.serieId ||
          classeSelectionnee.serie?.id;

        if (!niveauId) {
          setProgrammes([]);
          setErreur(
            "Le niveau de cette classe n'est pas renseigné."
          );
          return;
        }

        const params = {
          ecoleId,
          anneeScolaireId,
          niveauId,
        };

        if (serieId) {
          params.serieId = serieId;
        }

        console.log(
          "📚 Chargement programmes avec :",
          params
        );

        const res = await api.get(
          "/coefficients/programme/niveau",
          { params }
        );

        const liste = Array.isArray(res.data)
          ? res.data
          : [];

        console.log("📚 Programmes :", liste);

        setProgrammes(liste);
      } catch (error) {
        console.error(
          "Erreur chargement programmes :",
          error
        );

        setProgrammes([]);

        setErreur(
          error.response?.data?.message ||
            "Impossible de charger les programmes."
        );
      } finally {
        setLoadingProgrammes(false);
      }
    };

    chargerProgrammes();
  }, [
    ecoleId,
    anneeScolaireId,
    classeSelectionnee,
  ]);

  /* =======================================================
     5. CHARGER AFFECTATIONS DE LA CLASSE
  ======================================================= */

  const loadAffectations = async () => {
    if (!classeId || !anneeScolaireId) {
      setAffectations([]);
      return;
    }

    try {
      setLoadingAffectations(true);

      const res = await api.get(
        `/affectations-enseignants/classe/${classeId}`,
        {
          params: {
            anneeScolaireId,
          },
        }
      );

      const liste = Array.isArray(res.data)
        ? res.data
        : [];

      console.log("👨‍🏫 Affectations :", liste);

      setAffectations(liste);
    } catch (error) {
      console.error(
        "Erreur chargement affectations :",
        error
      );

      setAffectations([]);

      setErreur(
        error.response?.data?.message ||
          "Impossible de charger les affectations."
      );
    } finally {
      setLoadingAffectations(false);
    }
  };

  useEffect(() => {
    loadAffectations();
  }, [classeId, anneeScolaireId]);

  /* =======================================================
     6. PROGRAMMES + ENSEIGNANTS AFFECTÉS
  ======================================================= */

  const getAffectationsProgramme = (programme) => {
    return affectations.filter(
      (a) =>
        String(a.coefficientMatiereId) ===
        String(programme.id)
    );
  };

  /* =======================================================
     7. OUVRIR MODAL AJOUT
  ======================================================= */

  const ouvrirAjout = async (programme) => {
    try {
      setErreur("");
      setProgrammeSelectionne(programme);
      setEnseignantsDisponibles([]);
      setLoadingEnseignants(true);

      const matiereId =
        programme.matiereId ||
        programme.matiere?.id;

      if (!matiereId) {
        setErreur(
          "Impossible de déterminer la matière de ce programme."
        );
        return;
      }

      console.log(
        "👨‍🏫 Chargement enseignants matière :",
        matiereId
      );

      const res = await api.get(
        `/enseignants/matiere/${matiereId}`
      );

      const liste = Array.isArray(res.data)
        ? res.data
        : [];

      setEnseignantsDisponibles(liste);
    } catch (error) {
      console.error(
        "Erreur chargement enseignants :",
        error
      );

      setErreur(
        error.response?.data?.message ||
          "Impossible de charger les enseignants."
      );
    } finally {
      setLoadingEnseignants(false);
    }
  };

  /* =======================================================
     8. FERMER MODAL
  ======================================================= */

  const fermerModal = () => {
    setProgrammeSelectionne(null);
    setEnseignantsDisponibles([]);
    setAjoutEnCours(null);
  };

  /* =======================================================
     9. AJOUTER ENSEIGNANT
  ======================================================= */

  const ajouterEnseignant = async (enseignant) => {
    if (!programmeSelectionne || !classeId) return;

    try {
      setErreur("");
      setAjoutEnCours(enseignant.id);

      const payload = {
        enseignantId: enseignant.id,
        classeId: Number(classeId),
        coefficientMatiereId: programmeSelectionne.id,
      };

      console.log(
        "➕ Ajout affectation :",
        payload
      );

      await api.post(
        "/affectations-enseignants",
        payload
      );

      afficherToast(
        `✓ ${enseignant.prenom || ""} ${
          enseignant.nom || ""
        } a été affecté`
      );

      fermerModal();

      await loadAffectations();
    } catch (error) {
      console.error(
        "Erreur ajout enseignant :",
        error
      );

      setErreur(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Impossible d'affecter cet enseignant."
      );
    } finally {
      setAjoutEnCours(null);
    }
  };

  /* =======================================================
     10. RETIRER ENSEIGNANT
  ======================================================= */

  const retirerEnseignant = async (affectation) => {
    const nom = `${affectation.enseignantPrenom || ""} ${
      affectation.enseignantNom || ""
    }`.trim();

    const confirme = window.confirm(
      `Voulez-vous retirer ${nom} de cette affectation ?`
    );

    if (!confirme) return;

    try {
      setErreur("");
      setSuppressionEnCours(affectation.id);

      console.log(
        "🗑️ Suppression affectation :",
        affectation.id
      );

      await api.delete(
        `/affectations-enseignants/${affectation.id}`
      );

      afficherToast(
        `✓ ${nom} a été retiré de l'affectation`
      );

      await loadAffectations();
    } catch (error) {
      console.error(
        "Erreur retrait enseignant :",
        error
      );

      setErreur(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Impossible de retirer cet enseignant."
      );
    } finally {
      setSuppressionEnCours(null);
    }
  };

  /* =======================================================
     11. CHANGEMENT ANNÉE
  ======================================================= */

  const changerAnnee = (value) => {
    setAnneeScolaireId(value);
    setClasseId("");
    setProgrammes([]);
    setAffectations([]);
  };

  /* =======================================================
     12. CHANGEMENT CLASSE
  ======================================================= */

  const changerClasse = (value) => {
    setClasseId(value);
    setProgrammes([]);
    setAffectations([]);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <GraduationCap
              size={28}
              className="text-indigo-600"
            />
            Affectation des enseignants
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Gérez les enseignants affectés à chaque programme.
          </p>
        </div>

        {/* =================================================
            FILTRES
        ================================================= */}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* ANNÉE */}

            <div>
              <div>
  <label className="mb-1.5 block text-sm font-medium text-slate-700">
    Année scolaire
  </label>

  <select
    value={anneeScolaireId}
    onChange={(e) => changerAnnee(e.target.value)}
    disabled={loadingAnnees}
    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
  >
    <option value="">
      {loadingAnnees
        ? "Chargement..."
        : "-- Sélectionner une année --"}
    </option>

    {annees.map((annee) => (
      <option key={annee.id} value={annee.id}>
        {annee.libelle ||
          annee.nom ||
          annee.annee ||
          `${annee.dateDebut || ""} - ${annee.dateFin || ""}`}
      </option>
    ))}
  </select>
</div>
            </div>

            {/* CLASSE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Classe
              </label>

              <select
                value={classeId}
                onChange={(e) =>
                  changerClasse(e.target.value)
                }
                disabled={
                  loadingClasses ||
                  !anneeScolaireId
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  -- Sélectionner une classe --
                </option>

                {classes.map((classe) => (
                  <option
                    key={classe.id}
                    value={classe.id}
                  >
                    {classe.nomComplet}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* INFOS CLASSE */}

          {classeSelectionnee && (
            <div className="mt-4 flex flex-wrap gap-2">

              {classeSelectionnee.niveauNom ||
              classeSelectionnee.niveau?.nom ? (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  Niveau :{" "}
                  {classeSelectionnee.niveauNom ||
                    classeSelectionnee.niveau?.nom}
                </span>
              ) : null}

              {classeSelectionnee.serieNom ||
              classeSelectionnee.serie?.nom ? (
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                  Série :{" "}
                  {classeSelectionnee.serieNom ||
                    classeSelectionnee.serie?.nom}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* =================================================
            ERREUR
        ================================================= */}

        {erreur && (
          <div className="mb-5 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{erreur}</span>

            <button
              type="button"
              onClick={() => setErreur("")}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* =================================================
            PROGRAMMES
        ================================================= */}

        {!classeId || !anneeScolaireId ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen
              size={40}
              className="mx-auto mb-3 text-slate-300"
            />

            <p className="font-medium text-slate-600">
              Sélectionnez une année et une classe
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Les programmes de la classe seront affichés ici.
            </p>
          </div>
        ) : loadingProgrammes ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

            <p className="text-sm text-slate-500">
              Chargement des programmes...
            </p>
          </div>
        ) : programmes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen
              size={40}
              className="mx-auto mb-3 text-slate-300"
            />

            <p className="font-medium text-slate-600">
              Aucun programme trouvé
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Aucun programme n'est configuré pour cette classe.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {programmes.map((programme) => {

              const affectationsProgramme =
                getAffectationsProgramme(
                  programme
                );
                const sousGroupeNom =
  programme.sousGroupeNom ||
  programme.sousGroupe?.nom ||
  
  null;

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

              const coefficient =
                programme.coefficient ?? "-";

              const heures =
                programme.nombreHeuresParSemaine ??
                programme.volumeHoraire ??
                programme.heuresParSemaine;

              return (
                <div
                  key={programme.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >

                  {/* =========================================
                      PROGRAMME HEADER
                  ========================================= */}

                  <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">

                    <div className="flex items-start gap-3">

                      <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
                        <BookOpen size={22} />
                      </div>

                      <div>
                        <h2 className="font-semibold text-slate-800">
                          {matiereNom}
                        </h2>

                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">

                          <span className="rounded bg-slate-100 px-2 py-1">
                            Coeff. {coefficient}
                          </span>

                          {heures ? (
                            <span className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1">
                              <Clock size={12} />
                              {heures}h/semaine
                            </span>
                          ) : null}

                          {niveauNom ? (
                            <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-600">
                              {niveauNom}
                            </span>
                          ) : null}

                          {serieNom ? (
                            <span className="rounded bg-purple-50 px-2 py-1 text-purple-600">
                              Série {serieNom}
                            </span>
                          ) : null}
                          {sousGroupeNom ? (
  <span className="rounded bg-amber-50 px-2 py-1 font-medium text-amber-700">
    Sous-groupe : {sousGroupeNom}
  </span>
) : null}
                        </div>
                      </div>
                    </div>

                    {/* AJOUTER */}

                    <button
                      type="button"
                      onClick={() =>
                        ouvrirAjout(programme)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                      <Plus size={18} />
                      Ajouter
                    </button>
                  </div>

                  {/* =========================================
                      ENSEIGNANTS
                  ========================================= */}

                  <div className="p-5">

                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <UserRound size={17} />
                      Enseignants affectés
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {affectationsProgramme.length}
                      </span>
                    </div>

                    {loadingAffectations ? (
                      <div className="py-4 text-sm text-slate-400">
                        Chargement...
                      </div>
                    ) : affectationsProgramme.length ===
                      0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                        <p className="text-sm text-slate-400">
                          Aucun enseignant affecté à ce programme.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            ouvrirAjout(programme)
                          }
                          className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          + Ajouter un enseignant
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">

                        {affectationsProgramme.map(
                          (affectation) => {

                            const nom =
                              `${affectation.enseignantPrenom || ""} ${
                                affectation.enseignantNom || ""
                              }`.trim();

                            const suppression =
                              suppressionEnCours ===
                              affectation.id;

                            return (
                              <div
                                key={affectation.id}
                                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                              >

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
                                    <UserRound
                                      size={17}
                                    />
                                  </div>

                                  <div>
                                    <p className="text-sm font-medium text-slate-700">
                                      {nom ||
                                        "Enseignant"}
                                    </p>

                                    {affectation.enseignantEmail && (
                                      <p className="text-xs text-slate-400">
                                        {
                                          affectation.enseignantEmail
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    retirerEnseignant(
                                      affectation
                                    )
                                  }
                                  disabled={suppression}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 size={15} />

                                  {suppression
                                    ? "Retrait..."
                                    : "Retirer"}
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================
          MODAL AJOUT ENSEIGNANT
      ===================================================== */}

      {programmeSelectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="font-semibold text-slate-800">
                  Ajouter un enseignant
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {programmeSelectionne.matiereNom ||
                    programmeSelectionne.matiere?.nom}
                </p>
              </div>

              <button
                type="button"
                onClick={fermerModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* CONTENU */}

            <div className="max-h-[60vh] overflow-y-auto p-5">

              {loadingEnseignants ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

                  <p className="text-sm text-slate-500">
                    Chargement des enseignants...
                  </p>
                </div>
              ) : enseignantsDisponibles.length ===
                0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <UserRound
                    size={32}
                    className="mx-auto mb-2 text-slate-300"
                  />

                  <p className="text-sm font-medium text-slate-600">
                    Aucun enseignant disponible
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Aucun enseignant n'est associé à cette matière.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">

                  {enseignantsDisponibles.map(
                    (enseignant) => {

                      const dejaAffecte =
                        affectations.some(
                          (a) =>
                            String(
                              a.enseignantId
                            ) ===
                              String(
                                enseignant.id
                              ) &&
                            String(
                              a.coefficientMatiereId
                            ) ===
                              String(
                                programmeSelectionne.id
                              )
                        );

                      const ajout =
                        ajoutEnCours ===
                        enseignant.id;

                      return (
                        <div
                          key={enseignant.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                        >

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <UserRound
                                size={17}
                              />
                            </div>

                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {enseignant.prenom}{" "}
                                {enseignant.nom}
                              </p>

                              {enseignant.email && (
                                <p className="text-xs text-slate-400">
                                  {
                                    enseignant.email
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          {dejaAffecte ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
                              Déjà affecté
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                ajouterEnseignant(
                                  enseignant
                                )
                              }
                              disabled={ajout}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              <Plus size={15} />

                              {ajout
                                ? "Ajout..."
                                : "Ajouter"}
                            </button>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-right">

              <button
                type="button"
                onClick={fermerModal}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUSPENSE
========================================================= */

export default function AffectationEnseignantForm() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        </div>
      }
    >
      <AffectationEnseignantFormInner />
    </Suspense>
  );
}