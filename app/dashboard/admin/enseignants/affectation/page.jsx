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
const searchParams = useSearchParams();

const ecoleId =
  user?.ecoleId ||
  user?.ecole?.id ||
  user?.ecole?.ecoleId;

/* =======================================================
   PARAMÈTRES URL
======================================================= */

const classeIdParam = searchParams.get("classeId");

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
  /* Modal ajout */
  const [programmeSelectionne, setProgrammeSelectionne] =
    useState(null);

  const [enseignantsDisponibles, setEnseignantsDisponibles] =
    useState([]);

  const [loadingEnseignants, setLoadingEnseignants] =
    useState(false);

  const [ajoutEnCours, setAjoutEnCours] = useState(null);

  /* Suppression */
  const [suppressionEnCours, setSuppressionEnCours] =
    useState(null);

  /* =======================================================
     TOAST
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

    let actif = true;

    const chargerAnnees = async () => {
      try {
        setLoadingAnnees(true);
        setErreur("");

        console.log(
          "📅 Chargement années pour école :",
          ecoleId
        );

        const res = await api.get(
          `/annees/ecole/${ecoleId}`
        );

        const liste = Array.isArray(res.data)
          ? res.data
          : [];

        if (!actif) return;

        setAnnees(liste);

        if (liste.length === 0) {
          setAnneeScolaireId("");
          setErreur(
            "Aucune année scolaire trouvée."
          );
          return;
        }

        const active = liste.find(
          (a) =>
            a.active === true ||
            a.actif === true ||
            a.statut === "ACTIVE" ||
            a.statut === "ACTIF"
        );

        const anneeChoisie = active || liste[0];

        console.log(
          "📅 Année sélectionnée :",
          anneeChoisie
        );

        setAnneeScolaireId(
          String(anneeChoisie.id)
        );
      } catch (error) {
        if (!actif) return;

        console.error(
          "❌ Erreur chargement années :",
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

        setAnnees([]);
        setAnneeScolaireId("");

        setErreur(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Impossible de charger les années scolaires."
        );
      } finally {
        if (actif) {
          setLoadingAnnees(false);
        }
      }
    };

    chargerAnnees();

    return () => {
      actif = false;
    };
  }, [ecoleId]);

  /* =======================================================
     2. CHARGER CLASSES
  ======================================================= */

  useEffect(() => {
    if (!ecoleId) return;

    let actif = true;

    const chargerClasses = async () => {
      try {
        setLoadingClasses(true);

        const res = await api.get(
          `/classes/ecole/${ecoleId}`
        );

        if (!actif) return;

        setClasses(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (error) {
        if (!actif) return;

        console.error(
          "❌ Erreur chargement classes :",
          error
        );

        setErreur(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Impossible de charger les classes."
        );
      } finally {
        if (actif) {
          setLoadingClasses(false);
        }
      }
    };

    chargerClasses();

    return () => {
      actif = false;
    };
  }, [ecoleId]);

  /* =======================================================
     3. PRÉSELECTION CLASSE DEPUIS URL
  ======================================================= */

useEffect(() => {
  if (!classeIdParam || classes.length === 0) {
    return;
  }

  const classeTrouvee = classes.find(
    (classe) =>
      String(classe.id) === String(classeIdParam)
  );

  if (classeTrouvee) {
    console.log(
      "🎯 Classe présélectionnée depuis URL :",
      classeTrouvee
    );

    setClasseId(String(classeTrouvee.id));
  }
}, [classes, classeIdParam]);
  /* =======================================================
     CLASSE SÉLECTIONNÉE
  ======================================================= */

  const classeSelectionnee = useMemo(() => {
    return classes.find(
      (classe) =>
        String(classe.id) ===
        String(classeId)
    );
  }, [classes, classeId]);

  /* =======================================================
     4. CHARGER PROGRAMMES
  ======================================================= */

  /* =======================================================
   4. CHARGER PROGRAMMES
======================================================= */

useEffect(() => {
  if (
    !ecoleId ||
    !anneeScolaireId ||
    !classeSelectionnee
  ) {
    setProgrammes([]);
    return;
  }

  let actif = true;

  const chargerProgrammes = async () => {
    try {
      setLoadingProgrammes(true);
      setErreur("");

      const niveauId =
        classeSelectionnee.niveauId ||
        classeSelectionnee.niveau?.id;

      if (!niveauId) {
        setProgrammes([]);

        setErreur(
          "Le niveau de cette classe n'est pas renseigné."
        );

        return;
      }

      /*
       * IMPORTANT :
       * On charge TOUS les programmes de la classe.
       *
       * On ne filtre PAS par serieId ici.
       *
       * Le backend doit récupérer :
       * - les programmes directement liés à la classe
       * - les programmes liés aux sous-groupes de la classe
       */

      const params = {
        ecoleId: Number(ecoleId),
        anneeScolaireId: Number(anneeScolaireId),
        niveauId: Number(niveauId),
        classeId: Number(classeSelectionnee.id),
      };

      console.log(
        "📚 Chargement programmes :",
        params
      );

      const res = await api.get(
        "/coefficients/programme/classe",
        { params }
      );

      const liste = Array.isArray(res.data)
        ? res.data
        : [];

      if (!actif) return;

      console.log(
        "📚 PROGRAMMES REÇUS :",
        liste
      );

      console.log(
        "📚 NOMBRE DE PROGRAMMES :",
        liste.length
      );

     programmes.forEach((programme, index) => {
  console.log(`📘 Programme ${index + 1} :`, {
    id: programme.id,
    matiereId: programme.matiereId,
    matiereNom: programme.matiereNom,
    niveauId: programme.niveauId,
    niveauNom: programme.niveauNom,
    classeId: programme.classeId,
    serieId: programme.serieId,
    serieNom: programme.serieNom,
    sousGroupeId: programme.sousGroupeId,
    sousGroupeNom: programme.sousGroupeNom,
  });
});

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
        setLoadingProgrammes(false);
      }
    }
  };

  chargerProgrammes();

  return () => {
    actif = false;
  };

}, [
  ecoleId,
  anneeScolaireId,
  classeSelectionnee,
]);
  /* =======================================================
     5. CHARGER AFFECTATIONS
  ======================================================= */

  const loadAffectations = async () => {
  if (!classeId || !anneeScolaireId) {
    setAffectations([]);
    return;
  }

  try {
    setLoadingAffectations(true);

    console.log("👨‍🏫 Chargement affectations :", {
      classeId,
      anneeScolaireId,
    });

    const res = await api.get(
      `/affectations-enseignants/classe/${classeId}`,
      {
        params: {
          anneeScolaireId: Number(anneeScolaireId),
        },
      }
    );

    const liste = Array.isArray(res.data)
      ? res.data
      : [];

   liste.forEach((a, index) => {
  console.log(`👨‍🏫 AFFECTATION ${index + 1} :`, {
    id: a.id,
    enseignantId: a.enseignantId,
    enseignantNom: a.enseignantNom,
    enseignantPrenom: a.enseignantPrenom,

    classeId: a.classeId,

    coefficientMatiereId: a.coefficientMatiereId,

    matiereId: a.matiereId,
    matiereNom: a.matiereNom,

    sousGroupeId: a.sousGroupeId,
    sousGroupeNom: a.sousGroupeNom,
  });
});

    setAffectations(liste);
  } catch (error) {
    console.error(
      "❌ Erreur chargement affectations :",
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

    setAffectations([]);
  } finally {
    setLoadingAffectations(false);
  }
};
  useEffect(() => {
    loadAffectations();
  }, [
    classeId,
    anneeScolaireId,
  ]);

  /* =======================================================
     6. PROGRAMMES + AFFECTATIONS
  ======================================================= */

  const programmesAvecAffectations = useMemo(() => {
    return programmes.map((programme) => {
      /*
       * Les affectations complètes viennent du endpoint
       * /affectations-enseignants.
       *
       * On garde :
       * - id de l'affectation
       * - enseignantId
       * - nom
       * - prénom
       * - email
       */

      const affectationsProgramme =
        affectations.filter(
          (affectation) =>
            String(
              affectation.coefficientMatiereId
            ) === String(programme.id)
        );

      /*
       * Si le endpoint des affectations retourne
       * des données, elles sont prioritaires.
       */
      if (
        affectationsProgramme.length > 0
      ) {
        return {
          ...programme,

          enseignantsAffectes:
            affectationsProgramme.map(
              (affectation) => ({
                id: affectation.id,

                enseignantId:
                  affectation.enseignantId,

                nom:
                  `${affectation.enseignantPrenom || ""} ${
                    affectation.enseignantNom || ""
                  }`.trim() ||
                  "Enseignant",

                prenom:
                  affectation.enseignantPrenom ||
                  "",

                nomFamille:
                  affectation.enseignantNom ||
                  "",

                email:
                  affectation.enseignantEmail ||
                  "",
              })
            ),
        };
      }

      /*
       * FALLBACK :
       *
       * Ton CoefficientMatiereResponseDTO contient déjà :
       *
       * List<String> enseignantsAffectes
       *
       * Donc si le endpoint des affectations ne retourne
       * rien, on peut au moins afficher les noms.
       *
       * Ces éléments n'ont pas d'id d'affectation,
       * donc le bouton Retirer ne sera pas proposé.
       */

      const noms =
        Array.isArray(
          programme.enseignantsAffectes
        )
          ? programme.enseignantsAffectes
          : [];

      return {
        ...programme,

        enseignantsAffectes: noms.map(
          (nom, index) => ({
            id: `programme-${programme.id}-${index}`,
            enseignantId: null,
            nom:
              typeof nom === "string"
                ? nom
                : "Enseignant",
            prenom: "",
            nomFamille: "",
            email: "",
            readonly: true,
          })
        ),
      };
    });
  }, [
    programmes,
    affectations,
  ]);

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

      console.log(
        "👨‍🏫 Enseignants disponibles :",
        liste
      );

      setEnseignantsDisponibles(liste);
    } catch (error) {
      console.error(
        "❌ Erreur chargement enseignants :",
        error
      );

      setEnseignantsDisponibles([]);

      setErreur(
        error.response?.data?.message ||
          error.response?.data?.error ||
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

  const ajouterEnseignant = async (
    enseignant
  ) => {
    if (!programmeSelectionne) {
      return;
    }

    try {
      setErreur("");

      setAjoutEnCours(
        enseignant.id
      );

      /*
       * IMPORTANT :
       *
       * On ne remplace PAS une affectation existante.
       *
       * Chaque clic sur "Ajouter" crée une nouvelle
       * affectation pour le même coefficientMatiereId.
       *
       * Donc :
       *
       * Prof A -> coefficient 15
       * Prof B -> coefficient 15
       * Prof C -> coefficient 15
       *
       * sont trois affectations différentes.
       */

      const payload = {
        enseignantId: Number(
          enseignant.id
        ),

        classeId: Number(
          classeId
        ),

        coefficientMatiereId:
          Number(
            programmeSelectionne.id
          ),
      };

      console.log(
        "➕ AJOUT ENSEIGNANT",
        payload
      );

      const res = await api.post(
        "/affectations-enseignants",
        payload
      );

      console.log(
        "✅ Affectation créée :",
        res.data
      );

      afficherToast(
        `✓ ${enseignant.prenom || ""} ${
          enseignant.nom || ""
        } a été affecté au programme`
      );

      /*
       * Fermer immédiatement le modal.
       */
      fermerModal();

      /*
       * IMPORTANT :
       * recharger les affectations pour que
       * le nouvel enseignant apparaisse.
       */
      await loadAffectations();

      /*
       * Recharger également les programmes
       * afin de garder les données du DTO
       * synchronisées.
       */
      if (
  ecoleId &&
  anneeScolaireId &&
  classeSelectionnee
) {
  const niveauId =
    classeSelectionnee.niveauId ||
    classeSelectionnee.niveau?.id;

  if (niveauId) {
    const params = {
      ecoleId: Number(ecoleId),
      anneeScolaireId: Number(anneeScolaireId),
      niveauId: Number(niveauId),
      classeId: Number(classeSelectionnee.id),
    };

    try {
      const programmesRes =
        await api.get(
          "/coefficients/programme/classe",
          { params }
        );

      setProgrammes(
        Array.isArray(programmesRes.data)
          ? programmesRes.data
          : []
      );

    } catch (refreshError) {
      console.error(
        "⚠️ Impossible de rafraîchir les programmes :",
        refreshError
      );
    }
  }
}
    } catch (error) {
      console.error(
        "❌ ERREUR AJOUT ENSEIGNANT",
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

      console.error(
        "Message :",
        error.message
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

  const retirerEnseignant = async (
    affectation
  ) => {
    /*
     * Si l'élément vient directement de
     * programme.enseignantsAffectes,
     * il n'a pas d'id réel d'affectation.
     */
    if (
      affectation.readonly ||
      !affectation.id
    ) {
      setErreur(
        "Impossible de supprimer cette affectation car son identifiant n'est pas disponible."
      );

      return;
    }

    const nom =
      affectation.nom ||
      `${affectation.enseignantPrenom || ""} ${
        affectation.enseignantNom || ""
      }`.trim() ||
      "cet enseignant";

    const confirme =
      window.confirm(
        `Voulez-vous retirer ${nom} de cette affectation ?`
      );

    if (!confirme) {
      return;
    }

    try {
      setErreur("");

      setSuppressionEnCours(
        affectation.id
      );

      console.log(
        "🗑️ Suppression affectation :",
        affectation.id
      );

      await api.delete(
        `/affectations-enseignants/${affectation.id}`
      );

      afficherToast(
        `✓ ${nom} a été retiré du programme`
      );

      await loadAffectations();

      /*
       * Rafraîchir les programmes.
       */
      if (
        ecoleId &&
        anneeScolaireId &&
        classeSelectionnee
      ) {
        const niveauId =
          classeSelectionnee.niveauId ||
          classeSelectionnee.niveau?.id;

        const serieId =
          classeSelectionnee.serieId ||
          classeSelectionnee.serie?.id;

        if (niveauId) {
          const params = {
            ecoleId,
            anneeScolaireId,
            niveauId,
            classeId:
              classeSelectionnee.id,
          };

          if (serieId) {
            params.serieId = serieId;
          }

          try {
            const res =
              await api.get(
                "/coefficients/programme/classe",
                { params }
              );

            setProgrammes(
              Array.isArray(res.data)
                ? res.data
                : []
            );
          } catch (refreshError) {
            console.error(
              "⚠️ Erreur rafraîchissement programmes :",
              refreshError
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "❌ Erreur retrait enseignant :",
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

  const changerAnnee = (
    value
  ) => {
    setAnneeScolaireId(value);

    setClasseId("");

    setProgrammes([]);

    setAffectations([]);

    setProgrammeSelectionne(null);
  };

  /* =======================================================
     12. CHANGEMENT CLASSE
  ======================================================= */

  const changerClasse = (
    value
  ) => {
    setClasseId(value);

    setProgrammes([]);

    setAffectations([]);

    setProgrammeSelectionne(null);
  };

  /* =======================================================
     13. ENSEIGNANTS DÉJÀ AFFECTÉS
  ======================================================= */

  const getEnseignantsDejaAffectes =
    (programme) => {
      return affectations
        .filter(
          (affectation) =>
            String(
              affectation.coefficientMatiereId
            ) ===
            String(programme.id)
        )
        .map(
          (affectation) =>
            String(
              affectation.enseignantId
            )
        );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

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
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Année scolaire
              </label>

              <select
                value={anneeScolaireId}
                onChange={(e) =>
                  changerAnnee(
                    e.target.value
                  )
                }
                disabled={loadingAnnees}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  {loadingAnnees
                    ? "Chargement..."
                    : "-- Sélectionner une année --"}
                </option>

                {annees.map(
                  (annee) => (
                    <option
                      key={annee.id}
                      value={annee.id}
                    >
                      {annee.libelle ||
                        annee.nom ||
                        annee.annee ||
                        `${annee.dateDebut || ""} - ${
                          annee.dateFin || ""
                        }`}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* CLASSE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Classe
              </label>

              <select
                value={classeId}
                onChange={(e) =>
                  changerClasse(
                    e.target.value
                  )
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

                {classes.map(
                  (classe) => (
                    <option
                      key={classe.id}
                      value={classe.id}
                    >
                      {classe.nomComplet ||
                        classe.nom}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* INFOS CLASSE */}

          {classeSelectionnee && (
            <div className="mt-4 flex flex-wrap gap-2">

              {(
                classeSelectionnee.niveauNom ||
                classeSelectionnee.niveau?.nom
              ) ? (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  Niveau :{" "}
                  {classeSelectionnee.niveauNom ||
                    classeSelectionnee.niveau?.nom}
                </span>
              ) : null}

              {(
                classeSelectionnee.serieNom ||
                classeSelectionnee.serie?.nom
              ) ? (
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
              onClick={() =>
                setErreur("")
              }
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* =================================================
            PROGRAMMES
        ================================================= */}

        {!classeId ||
        !anneeScolaireId ? (
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

        ) : programmesAvecAffectations.length ===
          0 ? (

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

            {programmesAvecAffectations.map(
              (programme) => {

                const enseignantsAffectes =
                  programme.enseignantsAffectes ||
                  [];

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
                  programme.coefficient ??
                  "-";

                const heures =
                  programme.nombreHeuresParSemaine ??
                  programme.volumeHoraire ??
                  programme.heuresParSemaine;

                return (
                  <div
                    key={programme.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >

                    {/* =====================================
                        HEADER PROGRAMME
                    ===================================== */}

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
                              Coeff.{" "}
                              {coefficient}
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
                                Série{" "}
                                {serieNom}
                              </span>
                            ) : null}

                            {sousGroupeNom ? (
                              <span className="rounded bg-amber-50 px-2 py-1 font-medium text-amber-700">
                                Sous-groupe :{" "}
                                {sousGroupeNom}
                              </span>
                            ) : null}

                          </div>
                        </div>
                      </div>

                      {/* AJOUT */}

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirAjout(
                            programme
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                      >
                        <Plus size={18} />
                        Ajouter
                      </button>

                    </div>

                    {/* =====================================
                        ENSEIGNANTS
                    ===================================== */}

                    <div className="p-5">

                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">

                        <UserRound size={17} />

                        Enseignants affectés

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {
                            enseignantsAffectes.length
                          }
                        </span>

                      </div>

                      {loadingAffectations ? (

                        <div className="py-4 text-sm text-slate-400">
                          Chargement des affectations...
                        </div>

                      ) : enseignantsAffectes.length ===
                        0 ? (

                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">

                          <p className="text-sm text-slate-400">
                            Aucun enseignant affecté à ce programme.
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              ouvrirAjout(
                                programme
                              )
                            }
                            className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            + Ajouter un enseignant
                          </button>

                        </div>

                      ) : (

                        <div className="space-y-2">

                          {enseignantsAffectes.map(
                            (enseignant) => {

                              const suppression =
                                suppressionEnCours ===
                                enseignant.id;

                              return (
                                <div
                                  key={
                                    enseignant.id
                                  }
                                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                                >

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
                                      <UserRound
                                        size={17}
                                      />
                                    </div>

                                    <div>

                                      <p className="text-sm font-medium text-slate-700">
                                        {
                                          enseignant.nom
                                        }
                                      </p>

                                      {enseignant.email ? (
                                        <p className="text-xs text-slate-400">
                                          {
                                            enseignant.email
                                          }
                                        </p>
                                      ) : null}

                                    </div>
                                  </div>

                                  {!enseignant.readonly ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        retirerEnseignant(
                                          enseignant
                                        )
                                      }
                                      disabled={
                                        suppression
                                      }
                                      title="Retirer"
                                      className="inline-flex items-center justify-center rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Trash2
                                        size={16}
                                      />
                                    </button>
                                  ) : null}

                                </div>
                              );
                            }
                          )}

                        </div>
                      )}

                    </div>

                  </div>
                );
              }
            )}

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

                {(
                  programmeSelectionne.sousGroupeNom ||
                  programmeSelectionne.sousGroupe?.nom
                ) ? (
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    Sous-groupe :{" "}
                    {programmeSelectionne.sousGroupeNom ||
                      programmeSelectionne.sousGroupe?.nom}
                  </p>
                ) : null}

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
                        getEnseignantsDejaAffectes(
                          programmeSelectionne
                        ).includes(
                          String(
                            enseignant.id
                          )
                        );

                      const ajout =
                        ajoutEnCours ===
                        enseignant.id;

                      return (
                        <div
                          key={
                            enseignant.id
                          }
                          className={`flex items-center justify-between rounded-lg border p-3 ${
                            dejaAffecte
                              ? "border-emerald-200 bg-emerald-50/50"
                              : "border-slate-200 bg-white"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <UserRound
                                size={17}
                              />
                            </div>

                            <div>

                              <p className="text-sm font-medium text-slate-700">
                                {
                                  enseignant.prenom
                                }{" "}
                                {
                                  enseignant.nom
                                }
                              </p>

                              {enseignant.email ? (
                                <p className="text-xs text-slate-400">
                                  {
                                    enseignant.email
                                  }
                                </p>
                              ) : null}

                            </div>
                          </div>

                          {dejaAffecte ? (

                            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
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
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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