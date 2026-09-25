"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../../lib/api";
import {
  Download,
  Save,
  BarChart3,
  AlertCircle,
  Users,
  UsersRound,
  CheckCircle,
  BookOpen,
  Clock,
  GraduationCap,
  FileText,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ============================================================
// CONSTANTES — PRIMAIRE
// ============================================================

const MOIS_PRIMAIRE = [
  "SEPTEMBRE",
  "OCTOBRE",
  "NOVEMBRE",
  "DECEMBRE",
  "JANVIER",
  "FEVRIER",
  "MARS",
  "AVRIL",
  "MAI",
  "JUIN",
];

const MOIS_PRIMAIRE_LABELS = {
  SEPTEMBRE: "Septembre",
  OCTOBRE: "Octobre",
  NOVEMBRE: "Novembre",
  DECEMBRE: "Décembre",
  JANVIER: "Janvier",
  FEVRIER: "Février",
  MARS: "Mars",
  AVRIL: "Avril",
  MAI: "Mai",
  JUIN: "Juin",
};

// Note primaire : toujours sur 10.
const NOTE_MIN_PRIMAIRE = 0;
const NOTE_MAX_PRIMAIRE = 10;

// ============================================================
// CONSTANTES — SECONDAIRE
// ============================================================

const PERIODES = [
  "1ère Periode",
  "2ème Periode",
  "3ème Periode",
  "4ème Periode",
  "5ème Periode",
  "6ème Periode",
  "7ème Periode",
  "8ème Periode",
  "9ème Periode",
];

// ============================================================
// STYLES COMMUNS
// ============================================================

const STYLES = {
  input:
    "w-full rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-3.5 py-3 text-sm font-medium text-[#1B2333] outline-none transition placeholder:text-[#8A91A2] hover:border-[#C8C5B8] focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/10 disabled:cursor-not-allowed disabled:opacity-60",

  card:
    "rounded-[20px] border border-[#DEDCD0] bg-white shadow-[0_10px_30px_rgba(16,27,51,0.05)]",

  button: {
    primary:
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    secondary:
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
  },
};

// ============================================================
// HELPERS
// ============================================================

// Le cycle n'est pas un champ direct de Classe : il est porté par
// Classe.niveau.cycle.nom (voir entités Niveau / Cycle côté backend).
function getCycleNom(classe) {
  return (classe?.niveau?.cycle?.nom || "").toString().trim().toUpperCase();
}

function estClassePrimaire(classe) {
  return getCycleNom(classe) === "PREMIER CYCLE";
}

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

function LoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span className="text-sm text-slate-500">Chargement...</span>
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function NotesPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ============================================================
  // ÉTATS COMMUNS (classe / année)
  // ============================================================

  const [classes, setClasses] = useState([]);
  const [annees, setAnnees] = useState([]);

  const [classeId, setClasseId] = useState("");
  const [anneeId, setAnneeId] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [erreur, setErreur] = useState("");
  const [toast, setToast] = useState(null);

  const afficherToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const afficherErreur = useCallback((message) => {
    setErreur(message);
  }, []);

  // ============================================================
  // CHARGEMENT INITIAL (classes + années — commun aux deux cycles)
  // ============================================================

  useEffect(() => {
    if (!user?.ecole?.id) return;

    const chargerDonneesInitiales = async () => {
      try {
        const ecoleId = user.ecole.id;

        const [classesRes, anneesRes] = await Promise.all([
          api.get(`/classes/ecole/${ecoleId}`),
          api.get(`/annees/ecole/${ecoleId}`),
        ]);

        const classesData = Array.isArray(classesRes.data)
          ? classesRes.data
          : [];

        const anneesData = Array.isArray(anneesRes.data)
          ? anneesRes.data
          : [];

        setClasses(classesData);
        setAnnees(anneesData);

        const anneeActive = anneesData.find((a) => a.active);

        if (anneeActive) {
          setAnneeId(String(anneeActive.id));
        }
      } catch (error) {
        console.error("Erreur chargement initial :", error);
        afficherErreur("Impossible de charger les données initiales.");
      } finally {
        setLoadingInitial(false);
      }
    };

    chargerDonneesInitiales();
  }, [user, afficherErreur]);

  // ============================================================
  // CLASSE / CYCLE SÉLECTIONNÉS
  // ============================================================

  const classeChoisie = useMemo(() => {
    return classes.find((classe) => String(classe.id) === String(classeId));
  }, [classes, classeId]);

  const cycleNom = classeChoisie ? getCycleNom(classeChoisie) : "";
  const estPrimaire = cycleNom === "PREMIER CYCLE";
  const noteMax = estPrimaire ? NOTE_MAX_PRIMAIRE : 20;

  // ============================================================
  // RESET DES FILTRES SPÉCIFIQUES QUAND LA CLASSE / L'ANNÉE CHANGE
  // ============================================================

  const [moisPrimaire, setMoisPrimaire] = useState("");
  const [coefficientMatiereId, setCoefficientMatiereId] = useState("");
  const [periode, setPeriode] = useState("");

  useEffect(() => {
    setMoisPrimaire("");
    setCoefficientMatiereId("");
    setPeriode("");
    setErreur("");
  }, [classeId, anneeId]);

  // ============================================================
  // ================  BRANCHE PRIMAIRE  =========================
  // ============================================================

  const [elevesPrimaire, setElevesPrimaire] = useState([]);
  const [matieresPrimaire, setMatieresPrimaire] = useState([]);
  const [notesPrimaire, setNotesPrimaire] = useState({});
  const [loadingPrimaire, setLoadingPrimaire] = useState(false);
  const [savingPrimaire, setSavingPrimaire] = useState(false);
  const [generatingPrimaire, setGeneratingPrimaire] = useState(false);

  const chargerNotesPrimaire = useCallback(async () => {
    if (!estPrimaire) return;

    if (!classeId || !anneeId || !moisPrimaire) {
      setElevesPrimaire([]);
      setMatieresPrimaire([]);
      setNotesPrimaire({});
      return;
    }

    setLoadingPrimaire(true);
    setErreur("");

    try {
      const response = await api.get(`/notes-primaire/classe/${classeId}`, {
        params: {
          anneeId: Number(anneeId),
          mois: moisPrimaire,
        },
      });

      const data = response.data || {};

      setElevesPrimaire(Array.isArray(data.eleves) ? data.eleves : []);
      setMatieresPrimaire(Array.isArray(data.matieres) ? data.matieres : []);

      const notesMap = {};

      (data.notes || []).forEach((note) => {
        const key = `${note.inscriptionId}-${note.coefficientMatiereId}`;
        notesMap[key] = note.note ?? "";
      });

      setNotesPrimaire(notesMap);
    } catch (error) {
      console.error("Erreur chargement notes primaire :", error);
      afficherErreur(
        error.response?.data?.message || "Impossible de charger les notes."
      );

      setElevesPrimaire([]);
      setMatieresPrimaire([]);
      setNotesPrimaire({});
    } finally {
      setLoadingPrimaire(false);
    }
  }, [estPrimaire, classeId, anneeId, moisPrimaire, afficherErreur]);

  useEffect(() => {
    chargerNotesPrimaire();
  }, [chargerNotesPrimaire]);

  const modifierNotePrimaire = (inscriptionId, coefficientMatiereId, value) => {
    if (value !== "") {
      const nombre = Number(value);

      if (Number.isNaN(nombre)) return;
      if (nombre < NOTE_MIN_PRIMAIRE || nombre > NOTE_MAX_PRIMAIRE) return;
    }

    const key = `${inscriptionId}-${coefficientMatiereId}`;

    setNotesPrimaire((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const nombreNotesPrimaire = useMemo(() => {
    return Object.values(notesPrimaire).filter(
      (value) => value !== "" && value !== null && value !== undefined
    ).length;
  }, [notesPrimaire]);

  const calculerMoyennePrimaire = (eleve) => {
    const valeurs = matieresPrimaire
      .map(
        (matiere) =>
          notesPrimaire[`${eleve.inscriptionId}-${matiere.coefficientMatiereId}`]
      )
      .filter((value) => value !== "" && value !== null && value !== undefined)
      .map(Number)
      .filter((nombre) => !Number.isNaN(nombre));

    if (valeurs.length === 0) return null;

    return valeurs.reduce((somme, nombre) => somme + nombre, 0) / valeurs.length;
  };

  const getMoyenneColorPrimaire = (moyenne) => {
    if (moyenne === null) return "text-slate-300";
    if (moyenne < 5) return "text-rose-600";
    if (moyenne < 6) return "text-amber-600";
    return "text-emerald-600";
  };

  // --- Absences / observations du bulletin mensuel (même classe/mois) ---

  const [infosPrimaire, setInfosPrimaire] = useState({});
  const [loadingInfosPrimaire, setLoadingInfosPrimaire] = useState(false);

  const chargerInfosPrimaire = useCallback(async () => {
    if (!estPrimaire) return;

    if (!classeId || !anneeId || !moisPrimaire) {
      setInfosPrimaire({});
      return;
    }

    setLoadingInfosPrimaire(true);

    try {
      const response = await api.get("/bulletins-mensuels/infos", {
        params: {
          classeId: Number(classeId),
          anneeId: Number(anneeId),
          mois: moisPrimaire,
        },
      });

      const data = Array.isArray(response.data) ? response.data : [];

      const map = {};

      data.forEach((item) => {
        if (!item.inscriptionId) return;

        map[String(item.inscriptionId)] = {
          absences: item.absences ?? 0,
          observationMaitre: item.observationMaitre ?? "",
        };
      });

      setInfosPrimaire(map);
    } catch (error) {
      console.error("Erreur chargement infos bulletin primaire :", error);
      setInfosPrimaire({});
    } finally {
      setLoadingInfosPrimaire(false);
    }
  }, [estPrimaire, classeId, anneeId, moisPrimaire]);

  useEffect(() => {
    chargerInfosPrimaire();
  }, [chargerInfosPrimaire]);

  const getInfoPrimaire = (inscriptionId) => {
    return (
      infosPrimaire[String(inscriptionId)] || {
        absences: 0,
        observationMaitre: "",
      }
    );
  };

  const modifierInfoPrimaire = (inscriptionId, champ, valeur) => {
    if (champ === "absences" && valeur !== "" && Number(valeur) < 0) {
      return;
    }

    if (champ === "observationMaitre" && valeur.length > 500) {
      return;
    }

    const id = String(inscriptionId);

    setInfosPrimaire((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { absences: 0, observationMaitre: "" }),
        [champ]: valeur,
      },
    }));
  };

  const enregistrerPrimaire = async () => {
    if (!classeId || !anneeId || !moisPrimaire) {
      afficherErreur("Sélectionnez la classe, l'année scolaire et le mois.");
      return;
    }

    setSavingPrimaire(true);
    setErreur("");

    try {
      const payloadNotes = {
        classeId: Number(classeId),
        anneeScolaireId: Number(anneeId),
        mois: moisPrimaire,
        notes: [],
      };

      elevesPrimaire.forEach((eleve) => {
        matieresPrimaire.forEach((matiere) => {
          const key = `${eleve.inscriptionId}-${matiere.coefficientMatiereId}`;
          const value = notesPrimaire[key];

          payloadNotes.notes.push({
            inscriptionId: Number(eleve.inscriptionId),
            coefficientMatiereId: Number(matiere.coefficientMatiereId),
            note:
              value === "" || value === null || value === undefined
                ? null
                : Number(value),
          });
        });
      });

      const payloadInfos = {
        mois: moisPrimaire,
        infos: elevesPrimaire.map((eleve) => {
          const info = getInfoPrimaire(eleve.inscriptionId);

          return {
            inscriptionId: Number(eleve.inscriptionId),
            absences: info.absences === "" ? 0 : Number(info.absences),
            observationMaitre: info.observationMaitre || "",
          };
        }),
      };

      await Promise.all([
        api.post("/notes-primaire", payloadNotes),
        api.put("/bulletins-mensuels/infos", payloadInfos),
      ]);

      afficherToast(
        `✓ ${nombreNotesPrimaire} note(s), absences et observations enregistrées pour ${MOIS_PRIMAIRE_LABELS[moisPrimaire]}.`
      );

      await Promise.all([chargerNotesPrimaire(), chargerInfosPrimaire()]);
    } catch (error) {
      console.error("Erreur enregistrement primaire :", error);
      afficherErreur(
        error.response?.data?.message ||
          "Erreur lors de l'enregistrement des notes."
      );
    } finally {
      setSavingPrimaire(false);
    }
  };

  // ============================================================
  // ================  BRANCHE SECONDAIRE  =======================
  // ============================================================

  const [affectations, setAffectations] = useState([]);
  const [elevesSecondaire, setElevesSecondaire] = useState([]);
  const [notesSecondaire, setNotesSecondaire] = useState({
    saisies: {},
    existantes: {},
  });

  const [loadingAffectations, setLoadingAffectations] = useState(false);
  const [loadingElevesSecondaire, setLoadingElevesSecondaire] = useState(false);
  const [loadingNotesSecondaire, setLoadingNotesSecondaire] = useState(false);
  const [submittingSecondaire, setSubmittingSecondaire] = useState(false);

  // Chargement des affectations enseignant (matières disponibles)
  useEffect(() => {
    if (estPrimaire) {
      setAffectations([]);
      return;
    }

    if (!classeId || !anneeId) {
      setAffectations([]);
      return;
    }

    const chargerAffectations = async () => {
      setLoadingAffectations(true);

      try {
        const response = await api.get(
          `/affectations-enseignants/classe/${classeId}`,
          {
            params: {
              anneeScolaireId: Number(anneeId),
            },
          }
        );

        setAffectations(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erreur chargement affectations :", error);
        setAffectations([]);
      } finally {
        setLoadingAffectations(false);
      }
    };

    chargerAffectations();
  }, [estPrimaire, classeId, anneeId]);

  const matieresDisponibles = useMemo(() => {
    const matieresMap = new Map();

    affectations.forEach((affectation) => {
      const coefficientId = affectation.coefficientMatiereId;

      if (!coefficientId) return;

      if (!matieresMap.has(coefficientId)) {
        matieresMap.set(coefficientId, {
          id: coefficientId,
          matiereId: affectation.matiereId ?? null,
          nom: affectation.matiereNom ?? "Matière",
          coeff: affectation.coefficient ?? 0,
          heures: affectation.nombreHeuresParSemaine ?? null,
          sousGroupeId: affectation.sousGroupeId ?? null,
          sousGroupeNom: affectation.sousGroupeNom ?? null,
        });
      }
    });

    return Array.from(matieresMap.values()).sort((a, b) =>
      a.nom.localeCompare(b.nom)
    );
  }, [affectations]);

  const matiereChoisie = useMemo(() => {
    return matieresDisponibles.find(
      (matiere) => String(matiere.id) === String(coefficientMatiereId)
    );
  }, [matieresDisponibles, coefficientMatiereId]);

  const sousGroupeIdEffectif = matiereChoisie?.sousGroupeId ?? null;
  const sousGroupeNomEffectif = matiereChoisie?.sousGroupeNom ?? null;

  const affectationChoisie = useMemo(() => {
    if (!coefficientMatiereId) return null;

    return affectations.find(
      (affectation) =>
        String(affectation.coefficientMatiereId) ===
        String(coefficientMatiereId)
    );
  }, [affectations, coefficientMatiereId]);

  // Réinitialiser matière + période quand les affectations rechargent
  useEffect(() => {
    setCoefficientMatiereId("");
    setPeriode("");
    setNotesSecondaire({ saisies: {}, existantes: {} });
  }, [affectations]);

  // Chargement des élèves (secondaire — dépend éventuellement du sous-groupe)
  useEffect(() => {
    if (estPrimaire) {
      setElevesSecondaire([]);
      return;
    }

    if (!classeId || !anneeId) {
      setElevesSecondaire([]);
      return;
    }

    const chargerEleves = async () => {
      setLoadingElevesSecondaire(true);

      try {
        let url;

        if (sousGroupeIdEffectif) {
          url = `/sous-groupes/${sousGroupeIdEffectif}/eleves-annee-active`;
        } else {
          url = `/inscriptions/actif/classe/${classeId}/annee/${anneeId}`;
        }

        const response = await api.get(url);

        const eleves = Array.isArray(response.data) ? response.data : [];

        const elevesTries = [...eleves].sort((a, b) => {
          const nomA = `${a.nom ?? ""} ${a.prenom ?? ""}`.trim();
          const nomB = `${b.nom ?? ""} ${b.prenom ?? ""}`.trim();
          return nomA.localeCompare(nomB);
        });

        setElevesSecondaire(elevesTries);
      } catch (error) {
        console.error("Erreur chargement élèves :", error);
        setElevesSecondaire([]);
      } finally {
        setLoadingElevesSecondaire(false);
      }
    };

    chargerEleves();
  }, [estPrimaire, classeId, anneeId, sousGroupeIdEffectif]);

  // Chargement des notes existantes (secondaire)
  const chargerNotesExistantesSecondaire = useCallback(async () => {
    if (estPrimaire) return;

    if (!classeId || !coefficientMatiereId || !periode || !anneeId) {
      setNotesSecondaire({ saisies: {}, existantes: {} });
      return;
    }

    setLoadingNotesSecondaire(true);

    try {
      const params = {
        classeId: Number(classeId),
        coefficientMatiereId: Number(coefficientMatiereId),
        periode,
        anneeScolaireId: Number(anneeId),
      };

      if (sousGroupeIdEffectif) {
        params.sousGroupeId = Number(sousGroupeIdEffectif);
      }

      const response = await api.get("/notes/classe", { params });

      const notesListe = Array.isArray(response.data) ? response.data : [];

      const notesMap = {};

      notesListe.forEach((note) => {
        if (!note.inscriptionId) return;

        notesMap[String(note.inscriptionId)] = {
          id: note.id,
          nClass: note.nClass ?? note.nclass ?? "",
          nExem: note.nExem ?? note.nexem ?? "",
        };
      });

      setNotesSecondaire({
        saisies: notesMap,
        existantes: notesMap,
      });
    } catch (error) {
      console.error("Erreur chargement notes :", error);
      setNotesSecondaire({ saisies: {}, existantes: {} });
    } finally {
      setLoadingNotesSecondaire(false);
    }
  }, [estPrimaire, classeId, coefficientMatiereId, periode, anneeId, sousGroupeIdEffectif]);

  useEffect(() => {
    chargerNotesExistantesSecondaire();
  }, [chargerNotesExistantesSecondaire]);

  const handleNoteChangeSecondaire = (inscriptionId, champ, valeur) => {
    if (valeur === "") {
      setNotesSecondaire((prev) => ({
        ...prev,
        saisies: {
          ...prev.saisies,
          [String(inscriptionId)]: {
            ...(prev.saisies[String(inscriptionId)] || {}),
            [champ]: "",
          },
        },
      }));

      return;
    }

    const nombre = Number(valeur);

    if (Number.isNaN(nombre) || nombre < 0 || nombre > noteMax) {
      return;
    }

    setNotesSecondaire((prev) => ({
      ...prev,
      saisies: {
        ...prev.saisies,
        [String(inscriptionId)]: {
          ...(prev.saisies[String(inscriptionId)] || {}),
          [champ]: valeur,
        },
      },
    }));
  };

  const calculerMoyenne = (note) => {
    if (
      !note ||
      note.nClass === "" ||
      note.nClass == null ||
      note.nExem === "" ||
      note.nExem == null
    ) {
      return null;
    }

    const nClass = Number(note.nClass);
    const nExem = Number(note.nExem);

    if (Number.isNaN(nClass) || Number.isNaN(nExem)) {
      return null;
    }

    return (nClass + nExem * 2) / 3;
  };

  const getMoyenneColor = (moyenne) => {
    if (moyenne === null) return "text-slate-300";

    if (moyenne < 10) return "text-rose-600";
    if (moyenne < 12) return "text-amber-600";
    return "text-emerald-600";
  };

  const nbNotesModifieesSecondaire = useMemo(() => {
    return Object.keys(notesSecondaire.saisies).filter((id) => {
      const actuel = notesSecondaire.saisies[id];
      const original = notesSecondaire.existantes[id];

      if (!actuel) return false;
      if (actuel.nClass === "" && actuel.nExem === "") return false;
      if (!original) return true;

      return (
        String(actuel.nClass ?? "") !== String(original.nClass ?? "") ||
        String(actuel.nExem ?? "") !== String(original.nExem ?? "")
      );
    }).length;
  }, [notesSecondaire]);

  const getTexteNotesModifieesSecondaire = () => {
    if (nbNotesModifieesSecondaire === 0) {
      return "Aucune modification en attente";
    }

    if (nbNotesModifieesSecondaire === 1) {
      return "1 note modifiée non enregistrée";
    }

    return `${nbNotesModifieesSecondaire} notes modifiées non enregistrées`;
  };

  const downloadReleveNotes = async () => {
    setErreur("");

    if (!classeId || !coefficientMatiereId || !anneeId) {
      afficherErreur(
        "Choisissez la classe, l'année scolaire et la matière avant de générer le relevé."
      );
      return;
    }

    const affectation = affectations.find(
      (item) =>
        String(item.classeId) === String(classeId) &&
        String(item.coefficientMatiereId) === String(coefficientMatiereId)
    );

    if (!affectation?.id) {
      afficherErreur(
        "Aucune affectation enseignant trouvée pour cette matière."
      );
      return;
    }

    try {
      const response = await api.get(
        `/releves-notes/affectation/${affectation.id}/pdf`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `releve-notes-${matiereChoisie?.nom || "matiere"}-${classeId}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      afficherToast("✓ Relevé de notes généré avec succès");
    } catch (error) {
      console.error("Erreur génération relevé :", error);
      afficherErreur(
        error.response?.data?.message ||
          "Erreur lors de la génération du relevé de notes."
      );
    }
  };

  const enregistrerToutSecondaire = async () => {
    setErreur("");

    if (!classeId || !coefficientMatiereId || !anneeId || !periode) {
      afficherErreur(
        "Choisissez la classe, la matière, l'année et la période avant d'enregistrer."
      );
      return;
    }

    if (elevesSecondaire.length === 0) {
      afficherErreur("Aucun élève à enregistrer.");
      return;
    }

    const notesAEnvoyer = elevesSecondaire
      .map((eleve) => {
        const note = notesSecondaire.saisies[String(eleve.id)] || {};

        if (
          note.nClass === "" ||
          note.nClass == null ||
          note.nExem === "" ||
          note.nExem == null
        ) {
          return null;
        }

        const nClass = Number(note.nClass);
        const nExem = Number(note.nExem);

        if (
          Number.isNaN(nClass) ||
          Number.isNaN(nExem) ||
          nClass < 0 ||
          nClass > noteMax ||
          nExem < 0 ||
          nExem > noteMax
        ) {
          return null;
        }

        return {
          inscriptionId: eleve.id,
          nClass,
          nExem,
        };
      })
      .filter(Boolean);

    if (notesAEnvoyer.length === 0) {
      afficherErreur("Saisissez au moins une note complète avant d'enregistrer.");
      return;
    }

    const payload = {
      classeId: Number(classeId),
      coefficientMatiereId: Number(coefficientMatiereId),
      sousGroupeId: sousGroupeIdEffectif ? Number(sousGroupeIdEffectif) : null,
      periode,
      notes: notesAEnvoyer,
    };

    setSubmittingSecondaire(true);

    try {
      await api.post("/notes/en-masse", payload);

      afficherToast(`✓ ${notesAEnvoyer.length} note(s) enregistrée(s)`);

      await chargerNotesExistantesSecondaire();
    } catch (error) {
      console.error("Erreur enregistrement :", error);
      afficherErreur(
        error.response?.data?.message ||
          error.response?.data ||
          "Erreur lors de l'enregistrement."
      );
    } finally {
      setSubmittingSecondaire(false);
    }
  };

  // Bulletins mensuels du premier cycle : même API que la page Bulletins mensuels.
  const downloadBulletinsPrimaire = async () => {
    if (!estPrimaire || !classeId || !anneeId || !moisPrimaire) {
      afficherErreur("Choisissez une classe primaire, l'année et le mois.");
      return;
    }

    setGeneratingPrimaire(true);
    setErreur("");

    try {
      const response = await api.get(
        `/bulletins-mensuels/${classeId}/${anneeId}/pdf`,
        { params: { mois: moisPrimaire }, responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bulletins-mensuels-${classeId}-${moisPrimaire.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      afficherToast("✓ Bulletins mensuels téléchargés avec succès");
    } catch (error) {
      console.error("Erreur génération bulletins primaire :", error);
      let message = "Impossible de générer les bulletins mensuels.";
      const data = error?.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text());
          message = parsed.message || parsed.error || message;
        } catch {
          // La réponse d'erreur n'est pas du JSON.
        }
      } else if (data && typeof data === "object") {
        message = data.message || data.error || message;
      }
      afficherErreur(message);
    } finally {
      setGeneratingPrimaire(false);
    }
  };

  const downloadBulletinClasse = async () => {
    setErreur("");

    if (!classeId || !anneeId || !periode) {
      afficherErreur(
        "Choisissez la classe, l'année et la période avant de générer les bulletins."
      );
      return;
    }

    try {
      const response = await api.get("/bulletins/generate-classe", {
        params: {
          classeId: Number(classeId),
          anneeId: Number(anneeId),
          periode,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `bulletins-classe-${classeId}-${periode
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      afficherToast("✓ Bulletins de la classe générés avec succès");
    } catch (error) {
      console.error("Erreur génération bulletins :", error);
      afficherErreur("Erreur lors de la génération des bulletins de la classe.");
    }
  };

  // Résultats de fin d'année (décision du conseil des maîtres) — un PDF par
  // classe (une page par élève), disponible pour les deux cycles.
  const [generatingResultatsFinAnnee, setGeneratingResultatsFinAnnee] = useState(false);

  const downloadResultatsFinAnnee = async () => {
    setErreur("");

    if (!classeId || !anneeId) {
      afficherErreur(
        "Choisissez la classe et l'année scolaire avant de générer les résultats de fin d'année."
      );
      return;
    }

    setGeneratingResultatsFinAnnee(true);

    try {
      const response = await api.get(
        `/resultats-fin-annee/classe/${classeId}/pdf`,
        {
          params: { anneeScolaireId: Number(anneeId) },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `resultats-fin-annee-classe-${classeId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      afficherToast("✓ Résultats de fin d'année générés avec succès");
    } catch (error) {
      console.error("Erreur génération résultats de fin d'année :", error);

      let message = "Erreur lors de la génération des résultats de fin d'année.";
      const data = error?.response?.data;

      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text());
          message = parsed.message || parsed.error || message;
        } catch {
          // La réponse d'erreur n'est pas du JSON.
        }
      } else if (data && typeof data === "object") {
        message = data.message || data.error || message;
      }

      afficherErreur(message);
    } finally {
      setGeneratingResultatsFinAnnee(false);
    }
  };

  // ============================================================
  // CHARGEMENT GLOBAL
  // ============================================================

  if (loadingInitial) {
    return <LoadingSpinner />;
  }

  // ============================================================
  // COMPTEURS D'EN-TÊTE (selon le cycle actif)
  // ============================================================

  const elevesActifs = estPrimaire ? elevesPrimaire : elevesSecondaire;

  const notesCompletesSecondaire = elevesSecondaire.filter((eleve) => {
    const note = notesSecondaire.saisies[String(eleve.id)] || {};
    return (
      note.nClass !== "" &&
      note.nClass != null &&
      note.nExem !== "" &&
      note.nExem != null
    );
  }).length;

  const compteurComplet = estPrimaire
    ? nombreNotesPrimaire
    : notesCompletesSecondaire;

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="min-h-full space-y-5 bg-[#ECEAE2] p-3 sm:p-5 lg:p-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="overflow-hidden rounded-[22px] bg-[#101B33] shadow-[0_14px_35px_rgba(16,27,51,0.14)]">

        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-7">

          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#C89B3C]/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-[#2C8C82]/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#E4B655]">
                <BookOpen size={14} />
                {classeChoisie
                  ? estPrimaire
                    ? "Cycle primaire · Notes sur 10"
                    : `${cycleNom || "Second cycle"} · Notes sur 20`
                  : "Gestion pédagogique"}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Saisie des notes
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                {classeChoisie
                  ? estPrimaire
                    ? "Saisissez les notes mensuelles de chaque élève et de chaque matière (notation sur 10)."
                    : "Saisissez les notes de classe et d'examen. Le barème s'adapte automatiquement au cycle de la classe."
                  : "Choisissez une classe : le formulaire s'adapte automatiquement à son cycle (primaire ou secondaire)."}
              </p>

            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Users size={14} />
                  Élèves
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-white">
                  {elevesActifs.length}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle size={14} />
                  {estPrimaire ? "Notes saisies" : "Complètes"}
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-[#E4B655]">
                  {compteurComplet}
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          ERREUR
      ====================================================== */}

      {erreur && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#D2593F]/20 bg-[#F7E2DB] px-4 py-3.5 text-sm text-[#9D3929] shadow-sm">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span className="leading-5">{erreur}</span>
        </div>
      )}

      {/* ======================================================
          FILTRES
      ====================================================== */}

      <section className={`${STYLES.card} overflow-hidden`}>

        <div className="border-b border-[#DEDCD0] bg-[#FCFBF8] px-4 py-4 sm:px-6">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7E3F8] text-[#6E5DC6]">
                  <GraduationCap size={17} />
                </span>
                <h2 className="text-base font-bold text-[#101B33] sm:text-lg">
                  Sélection pédagogique
                </h2>
              </div>

              <p className="mt-1 pl-10 text-xs leading-5 text-[#6B7280] sm:text-sm">
                {classeId
                  ? estPrimaire
                    ? "Classe primaire : sélectionnez l'année scolaire et le mois."
                    : "Classe secondaire : sélectionnez l'année, la matière et la période."
                  : "Choisissez d'abord une classe."}
              </p>
            </div>

            {!estPrimaire && matiereChoisie && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#DCEDEA] px-3 py-1.5 text-xs font-semibold text-[#236F68]">
                <CheckCircle size={14} />
                Programme sélectionné
              </div>
            )}

          </div>

        </div>

        <div className="p-4 sm:p-6">

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

            {/* CLASSE — toutes classes confondues, le cycle décide de la suite */}

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                Classe
              </span>

              <select
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
                className={STYLES.input}
              >
                <option value="">Sélectionner une classe</option>

                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nomComplet}
                    {estClassePrimaire(classe) ? " (Primaire)" : ""}
                  </option>
                ))}
              </select>
            </label>

            {/* ANNÉE */}

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                Année scolaire
              </span>

              <select
                value={anneeId}
                onChange={(e) => setAnneeId(e.target.value)}
                className={STYLES.input}
              >
                <option value="">Sélectionner l&apos;année</option>

                {annees.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.nom} {annee.active ? "— Active" : ""}
                  </option>
                ))}
              </select>
            </label>

            {/* ============ CHAMPS SPÉCIFIQUES PRIMAIRE ============ */}

            {estPrimaire && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                  Mois
                </span>

                <select
                  value={moisPrimaire}
                  onChange={(e) => setMoisPrimaire(e.target.value)}
                  disabled={!classeId}
                  className={STYLES.input}
                >
                  <option value="">Sélectionner un mois</option>

                  {MOIS_PRIMAIRE.map((item) => (
                    <option key={item} value={item}>
                      {MOIS_PRIMAIRE_LABELS[item]}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* ============ CHAMPS SPÉCIFIQUES SECONDAIRE ============ */}

            {!estPrimaire && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                    Matière / programme
                  </span>

                  <select
                    value={coefficientMatiereId}
                    onChange={(e) => setCoefficientMatiereId(e.target.value)}
                    disabled={!classeId || matieresDisponibles.length === 0}
                    className={STYLES.input}
                  >
                    <option value="">
                      {!classeId
                        ? "Choisissez d'abord une classe"
                        : loadingAffectations
                          ? "Chargement..."
                          : matieresDisponibles.length === 0
                            ? "Aucune matière disponible"
                            : "Sélectionner une matière"}
                    </option>

                    {matieresDisponibles.map((matiere) => (
                      <option key={matiere.id} value={matiere.id}>
                        {matiere.nom} — Coef. {matiere.coeff}
                        {matiere.sousGroupeNom
                          ? ` — ${matiere.sousGroupeNom}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                    Période
                  </span>

                  <select
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    disabled={!coefficientMatiereId}
                    className={STYLES.input}
                  >
                    <option value="">Sélectionner une période</option>

                    {PERIODES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

          </div>

          {/* ==================================================
              INFORMATIONS PROGRAMME (secondaire uniquement)
          ================================================== */}

          {!estPrimaire && matiereChoisie && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#DEDCD0] bg-[#F8F7F2]">

              <div className="border-b border-[#DEDCD0] px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DCEDEA] text-[#2C8C82]">
                    <BookOpen size={16} />
                  </span>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A91A2]">
                      Programme sélectionné
                    </p>
                    <p className="text-sm font-bold text-[#101B33]">
                      {matiereChoisie.nom}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-y divide-[#DEDCD0] sm:grid-cols-5 sm:divide-y-0">

                <div className="p-4">
                  <p className="text-xs font-medium text-[#7A8190]">Coefficient</p>
                  <p className="mt-1 font-mono text-lg font-bold text-[#C89B3C]">
                    {matiereChoisie.coeff}
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium text-[#7A8190]">Volume horaire</p>
                  <p className="mt-1 font-mono text-lg font-bold text-[#101B33]">
                    {matiereChoisie.heures != null
                      ? `${matiereChoisie.heures}h`
                      : "—"}
                    {matiereChoisie.heures != null && (
                      <span className="ml-1 font-sans text-xs font-medium text-[#7A8190]">
                        / semaine
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium text-[#7A8190]">Groupe</p>
                  <p
                    className={`mt-1 truncate text-sm font-bold ${
                      sousGroupeNomEffectif ? "text-[#6E5DC6]" : "text-[#2C8C82]"
                    }`}
                  >
                    {sousGroupeNomEffectif || "Toute la classe"}
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium text-[#7A8190]">Cycle</p>
                  <p className="mt-1 truncate text-sm font-bold text-[#101B33]">
                    {cycleNom || "—"}
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium text-[#7A8190]">Barème</p>
                  <p className="mt-1 font-mono text-lg font-bold text-[#C89B3C]">
                    /{noteMax}
                  </p>
                </div>

              </div>

              {sousGroupeIdEffectif && (
                <div className="m-3 flex items-start gap-2 rounded-xl bg-[#E7E3F8] px-3.5 py-3 text-xs leading-5 text-[#5747A5] sm:m-4">
                  <UsersRound className="mt-0.5 shrink-0" size={15} />
                  <span>
                    <strong>Sous-groupe automatique :</strong> les notes sont
                    enregistrées uniquement pour les élèves du sous-groupe{" "}
                    <strong>{sousGroupeNomEffectif}</strong>.
                  </span>
                </div>
              )}

            </div>
          )}

          {!estPrimaire && classeId && !loadingAffectations && !affectations.length && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E4B655]/30 bg-[#FFF7DF] px-3.5 py-3 text-sm text-[#8A6818]">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>
                Aucun programme ou aucune affectation trouvée pour cette classe
                et cette année scolaire.
              </span>
            </div>
          )}

          {estPrimaire && classes.length > 0 && (
            <p className="mt-4 text-xs text-[#8A91A2]">
              Classe de cycle primaire — les notes sont saisies par mois, sur{" "}
              {NOTE_MAX_PRIMAIRE}, pour chaque matière du programme.
            </p>
          )}

        </div>

      </section>

      {/* ======================================================
          RÉSULTATS DE FIN D'ANNÉE (commun aux deux cycles)
      ====================================================== */}

      {classeId && anneeId && (
        <section className={`${STYLES.card} overflow-hidden`}>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#101B33] text-[#E4B655]">
                <Award size={19} />
              </span>

              <div>
                <p className="text-sm font-bold text-[#101B33]">
                  Résultats de fin d&apos;année
                </p>
                <p className="mt-0.5 text-xs text-[#7A8190]">
                  Décision du conseil des maîtres, un document par élève de{" "}
                  {classeChoisie?.nomComplet || "la classe"}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={downloadResultatsFinAnnee}
              disabled={generatingResultatsFinAnnee}
              className={`${STYLES.button.primary} bg-[#6E5DC6] shadow-sm hover:bg-[#5747A5]`}
            >
              <Download size={17} />
              {generatingResultatsFinAnnee
                ? "Génération..."
                : "Télécharger les résultats"}
            </button>

          </div>
        </section>
      )}

      {/* ======================================================
          ACTIONS (secondaire uniquement)
      ====================================================== */}

      {!estPrimaire && (
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">

          {matiereChoisie && affectationChoisie && (
            <div className="mb-3 w-full rounded-2xl border border-[#DEDCD0] bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7E3F8] text-[#6E5DC6]">
                    <GraduationCap size={18} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A91A2]">
                      Relevé de notes
                    </p>
                    <p className="text-sm font-bold text-[#101B33]">
                      {matiereChoisie.nom} · {classeChoisie?.nomComplet || "Classe"}
                    </p>
                    <p className="mt-0.5 text-xs text-[#7A8190]">
                      Enseignant :{" "}
                      <span className="font-semibold text-[#101B33]">
                        {affectationChoisie.enseignantNom ?? ""}{" "}
                        {affectationChoisie.enseignantPrenom ?? ""}
                      </span>
                    </p>
                  </div>
                </div>

                {sousGroupeNomEffectif && (
                  <span className="w-fit rounded-full bg-[#E7E3F8] px-3 py-1.5 text-xs font-bold text-[#5747A5]">
                    Sous-groupe : {sousGroupeNomEffectif}
                  </span>
                )}

              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push("/dashboard/admin/notes/resultats")}
            className={`${STYLES.button.primary} bg-[#101B33] shadow-sm hover:bg-[#182746]`}
          >
            <BarChart3 size={17} />
            Voir les résultats
          </button>

          <button
            type="button"
            onClick={downloadReleveNotes}
            disabled={!classeId || !coefficientMatiereId || !anneeId}
            className={`${STYLES.button.primary} bg-[#2C8C82] shadow-sm hover:bg-[#236F68]`}
          >
            <FileText size={17} />
            Relevé de notes
          </button>

          <button
            type="button"
            onClick={downloadBulletinClasse}
            disabled={!classeId || !anneeId || !periode}
            className={`${STYLES.button.primary} bg-[#C89B3C] shadow-sm hover:bg-[#B68931]`}
          >
            <Download size={17} />
            Télécharger les bulletins
          </button>

        </div>
      )}

      {/* ======================================================
          ===============  TABLEAU — PRIMAIRE  ==================
      ====================================================== */}

      {estPrimaire && classeId && anneeId && moisPrimaire && (
        <section className={`${STYLES.card} overflow-hidden`}>

          <div className="flex flex-col gap-3 border-b border-[#DEDCD0] bg-[#FCFBF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-bold text-[#101B33]">
                Notes — {MOIS_PRIMAIRE_LABELS[moisPrimaire]}
                <span className="ml-2 rounded-full bg-[#101B33]/5 px-2 py-0.5 text-[11px] font-bold text-[#101B33]">
                  Notes sur {NOTE_MAX_PRIMAIRE}
                </span>
              </h2>

              <p className="mt-1 text-xs text-[#7A8190]">
                {elevesPrimaire.length} élève(s) · {matieresPrimaire.length} matière(s)
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={enregistrerPrimaire}
                disabled={
                  savingPrimaire ||
                  generatingPrimaire ||
                  loadingPrimaire ||
                  loadingInfosPrimaire ||
                  !elevesPrimaire.length
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#101B33] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#182746] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {savingPrimaire ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={downloadBulletinsPrimaire}
                disabled={
                  generatingPrimaire ||
                  savingPrimaire ||
                  loadingPrimaire ||
                  loadingInfosPrimaire ||
                  !elevesPrimaire.length
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C89B3C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#B68931] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={17} />
                {generatingPrimaire ? "Génération..." : "Télécharger les bulletins"}
              </button>
            </div>
          </div>

          {loadingPrimaire || loadingInfosPrimaire ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
              <p className="text-sm text-[#7A8190]">Chargement des notes...</p>
            </div>
          ) : elevesPrimaire.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Users className="mx-auto mb-3 text-[#9BA2B1]" size={30} />
              <p className="font-semibold text-[#5B6478]">
                Aucun élève validé dans cette classe.
              </p>
            </div>
          ) : matieresPrimaire.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <BookOpen className="mx-auto mb-3 text-[#9BA2B1]" size={30} />
              <p className="font-semibold text-[#5B6478]">
                Aucun programme pédagogique trouvé pour cette classe.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-[#F8F7F2]">
                    <th className="sticky left-0 z-10 min-w-[230px] border-b border-[#DEDCD0] bg-[#F8F7F2] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                      Élève
                    </th>

                    {matieresPrimaire.map((matiere) => (
                      <th
                        key={matiere.coefficientMatiereId}
                        className="min-w-[120px] border-b border-[#DEDCD0] px-3 py-3 text-center"
                      >
                        <div className="text-xs font-bold text-[#101B33]">
                          {matiere.matiereNom}
                        </div>
                        <div className="mt-1 text-[10px] text-[#8A91A2]">
                          /{NOTE_MAX_PRIMAIRE}
                        </div>
                      </th>
                    ))}

                    <th className="min-w-[110px] border-b border-[#DEDCD0] px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                      Absences
                    </th>

                    <th className="min-w-[100px] border-b border-[#DEDCD0] px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                      Moyenne
                    </th>

                    <th className="min-w-[220px] border-b border-[#DEDCD0] px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                      Observation du maître
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {elevesPrimaire.map((eleve, index) => (
                    <tr
                      key={eleve.inscriptionId}
                      className="border-b border-[#F0EEE7] hover:bg-[#FCFBF8]"
                    >
                      <td className="sticky left-0 z-10 border-r border-[#F0EEE7] bg-white px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#101B33] text-xs font-bold text-[#E4B655]">
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-[#101B33]">
                              {eleve.nom} {eleve.prenom}
                            </div>
                            {eleve.matricule && (
                              <div className="font-mono text-[10px] text-[#8A91A2]">
                                {eleve.matricule}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {matieresPrimaire.map((matiere) => {
                        const key = `${eleve.inscriptionId}-${matiere.coefficientMatiereId}`;
                        const value = notesPrimaire[key] ?? "";

                        return (
                          <td
                            key={matiere.coefficientMatiereId}
                            className="px-3 py-2 text-center"
                          >
                            <input
                              type="number"
                              min={NOTE_MIN_PRIMAIRE}
                              max={NOTE_MAX_PRIMAIRE}
                              step="0.01"
                              inputMode="decimal"
                              value={value}
                              onChange={(e) =>
                                modifierNotePrimaire(
                                  eleve.inscriptionId,
                                  matiere.coefficientMatiereId,
                                  e.target.value
                                )
                              }
                              className="w-24 rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-2 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/10"
                            />
                          </td>
                        );
                      })}

                      {(() => {
                        const info = getInfoPrimaire(eleve.inscriptionId);
                        const moyenne = calculerMoyennePrimaire(eleve);

                        return (
                          <>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={info.absences}
                                onChange={(e) =>
                                  modifierInfoPrimaire(
                                    eleve.inscriptionId,
                                    "absences",
                                    e.target.value
                                  )
                                }
                                className="w-20 rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-2 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/10"
                              />
                            </td>

                            <td className="px-3 py-2 text-center">
                              <span
                                className={`font-mono text-sm font-bold ${getMoyenneColorPrimaire(moyenne)}`}
                              >
                                {moyenne !== null ? moyenne.toFixed(2) : "—"}
                              </span>
                              <div className="mt-0.5 text-[9px] font-medium text-[#9BA2B1]">
                                /{NOTE_MAX_PRIMAIRE}
                              </div>
                            </td>

                            <td className="px-3 py-2">
                              <input
                                type="text"
                                maxLength={500}
                                value={info.observationMaitre}
                                onChange={(e) =>
                                  modifierInfoPrimaire(
                                    eleve.inscriptionId,
                                    "observationMaitre",
                                    e.target.value
                                  )
                                }
                                placeholder="Observation du mois..."
                                className="w-full min-w-[200px] rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-3 py-2.5 text-sm text-[#101B33] outline-none focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/10"
                              />
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </section>
      )}

      {/* ======================================================
          ===============  TABLEAU — SECONDAIRE  ================
      ====================================================== */}

      {!estPrimaire && classeId && coefficientMatiereId && periode && (
        <section className={`${STYLES.card} overflow-hidden`}>

          <div className="border-b border-[#DEDCD0] bg-[#FCFBF8] px-4 py-4 sm:px-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#101B33] text-[#E4B655]">
                    <Users size={17} />
                  </span>

                  <div>
                    <h2 className="text-base font-bold text-[#101B33] sm:text-lg">
                      Notes des élèves
                    </h2>
                    <p className="mt-0.5 text-xs text-[#7A8190]">
                      {sousGroupeIdEffectif
                        ? `Sous-groupe « ${sousGroupeNomEffectif} »`
                        : "Toute la classe"}
                      {" · "}
                      {elevesSecondaire.length} élève
                      {elevesSecondaire.length > 1 ? "s" : ""}
                      {" · "}
                      Barème /{noteMax}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#DCEDEA] px-3 py-1.5 text-xs font-bold text-[#236F68]">
                  {notesCompletesSecondaire}/{elevesSecondaire.length} complètes
                </span>

                {nbNotesModifieesSecondaire > 0 && (
                  <span className="rounded-full bg-[#F7E2DB] px-3 py-1.5 text-xs font-bold text-[#9D3929]">
                    {nbNotesModifieesSecondaire} modif.
                  </span>
                )}
              </div>

            </div>

          </div>

          <div className="p-3 sm:p-5">

            {/* ==================================================
                MOBILE
            ================================================== */}

            <div className="space-y-3 lg:hidden">

              {(loadingElevesSecondaire || loadingNotesSecondaire) && (
                <div className="rounded-2xl border border-[#DEDCD0] bg-[#F8F7F2] px-4 py-10 text-center">
                  <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
                  <p className="text-sm font-medium text-[#7A8190]">
                    Chargement des notes...
                  </p>
                </div>
              )}

              {!loadingElevesSecondaire &&
                !loadingNotesSecondaire &&
                elevesSecondaire.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#DEDCD0] bg-[#F8F7F2] px-4 py-10 text-center">
                    <Users className="mx-auto mb-3 text-[#9BA2B1]" size={28} />
                    <p className="text-sm font-semibold text-[#5B6478]">
                      {sousGroupeIdEffectif
                        ? `Aucun élève dans le sous-groupe « ${sousGroupeNomEffectif} ».`
                        : "Aucun élève dans cette classe."}
                    </p>
                  </div>
                )}

              {!loadingElevesSecondaire &&
                !loadingNotesSecondaire &&
                elevesSecondaire.map((eleve, index) => {
                  const note = notesSecondaire.saisies[String(eleve.id)] || {};
                  const moyenne = calculerMoyenne(note);

                  return (
                    <div
                      key={eleve.id}
                      className="rounded-2xl border border-[#DEDCD0] bg-white p-3.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#101B33] font-mono text-xs font-bold text-[#E4B655]">
                            {String(index + 1).padStart(2, "0")}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#101B33]">
                              {eleve.nom} {eleve.prenom}
                            </p>
                            {eleve.matricule && (
                              <p className="mt-0.5 truncate font-mono text-[10px] text-[#8A91A2]">
                                {eleve.matricule}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A91A2]">
                            Moyenne
                          </p>
                          <p
                            className={`font-mono text-lg font-bold ${getMoyenneColor(moyenne)}`}
                          >
                            {moyenne !== null ? moyenne.toFixed(2) : "—"}
                          </p>
                          <p className="text-[9px] font-medium text-[#9BA2B1]">
                            /{noteMax}
                          </p>
                        </div>

                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <label className="rounded-xl bg-[#F8F7F2] p-2.5">
                          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#7A8190]">
                            Note classe /{noteMax}
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            max={noteMax}
                            value={note.nClass ?? ""}
                            onChange={(e) =>
                              handleNoteChangeSecondaire(eleve.id, "nClass", e.target.value)
                            }
                            className="w-full rounded-lg border border-[#DEDCD0] bg-white px-2.5 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                          />
                        </label>

                        <label className="rounded-xl bg-[#F8F7F2] p-2.5">
                          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#7A8190]">
                            Note examen /{noteMax}
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            max={noteMax}
                            value={note.nExem ?? ""}
                            onChange={(e) =>
                              handleNoteChangeSecondaire(eleve.id, "nExem", e.target.value)
                            }
                            className="w-full rounded-lg border border-[#DEDCD0] bg-white px-2.5 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                          />
                        </label>

                      </div>

                    </div>
                  );
                })}

            </div>

            {/* ==================================================
                DESKTOP
            ================================================== */}

            <div className="hidden overflow-x-auto lg:block">

              <table className="w-full min-w-[760px] text-left text-sm">

                <thead>
                  <tr className="border-b border-[#DEDCD0] bg-[#F8F7F2] text-[10px] uppercase tracking-[0.12em] text-[#7A8190]">
                    <th className="rounded-l-xl px-4 py-3.5 font-bold">#</th>
                    <th className="px-4 py-3.5 font-bold">Élève</th>
                    <th className="px-4 py-3.5 text-center font-bold">
                      Note classe /{noteMax}
                    </th>
                    <th className="px-4 py-3.5 text-center font-bold">
                      Note examen /{noteMax}
                    </th>
                    <th className="rounded-r-xl px-4 py-3.5 text-center font-bold">
                      Moyenne /{noteMax}
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {(loadingElevesSecondaire || loadingNotesSecondaire) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center">
                        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
                        <span className="text-sm font-medium text-[#7A8190]">
                          Chargement des notes...
                        </span>
                      </td>
                    </tr>
                  )}

                  {!loadingElevesSecondaire &&
                    !loadingNotesSecondaire &&
                    elevesSecondaire.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-14 text-center">
                          <Users className="mx-auto mb-3 text-[#9BA2B1]" size={28} />
                          <p className="text-sm font-semibold text-[#5B6478]">
                            {sousGroupeIdEffectif
                              ? `Aucun élève dans le sous-groupe « ${sousGroupeNomEffectif} ».`
                              : "Aucun élève dans cette classe."}
                          </p>
                        </td>
                      </tr>
                    )}

                  {!loadingElevesSecondaire &&
                    !loadingNotesSecondaire &&
                    elevesSecondaire.map((eleve, index) => {
                      const note = notesSecondaire.saisies[String(eleve.id)] || {};
                      const moyenne = calculerMoyenne(note);

                      return (
                        <tr
                          key={eleve.id}
                          className="border-b border-[#F0EEE7] transition last:border-0 hover:bg-[#FCFBF8]"
                        >
                          <td className="px-4 py-4">
                            <span className="font-mono text-xs font-bold text-[#9BA2B1]">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#101B33] text-xs font-bold text-[#E4B655]">
                                {(eleve.nom || "?").charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-[#101B33]">
                                  {eleve.nom} {eleve.prenom}
                                </div>
                                {eleve.matricule && (
                                  <div className="mt-0.5 font-mono text-[10px] text-[#8A91A2]">
                                    {eleve.matricule}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              max={noteMax}
                              value={note.nClass ?? ""}
                              onChange={(e) =>
                                handleNoteChangeSecondaire(eleve.id, "nClass", e.target.value)
                              }
                              className="w-24 rounded-xl border border-[#DEDCD0] bg-white px-2.5 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none transition hover:border-[#C8C5B8] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                            />
                          </td>

                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              max={noteMax}
                              value={note.nExem ?? ""}
                              onChange={(e) =>
                                handleNoteChangeSecondaire(eleve.id, "nExem", e.target.value)
                              }
                              className="w-24 rounded-xl border border-[#DEDCD0] bg-white px-2.5 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none transition hover:border-[#C8C5B8] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                            />
                          </td>

                          <td
                            className={`px-4 py-4 text-center font-mono text-base font-bold ${getMoyenneColor(moyenne)}`}
                          >
                            {moyenne !== null ? moyenne.toFixed(2) : "—"}
                          </td>

                        </tr>
                      );
                    })}

                </tbody>

              </table>

            </div>

            {/* ==================================================
                FOOTER ENREGISTREMENT
            ================================================== */}

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#DEDCD0] bg-[#F8F7F2] p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    nbNotesModifieesSecondaire > 0
                      ? "bg-[#F7E2DB] text-[#D2593F]"
                      : "bg-[#DCEDEA] text-[#2C8C82]"
                  }`}
                >
                  {nbNotesModifieesSecondaire > 0 ? (
                    <Clock size={17} />
                  ) : (
                    <CheckCircle size={17} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#101B33]">
                    {getTexteNotesModifieesSecondaire()}
                  </p>
                  <p className="mt-0.5 text-xs text-[#7A8190]">
                    {nbNotesModifieesSecondaire > 0
                      ? "Enregistrez pour appliquer les changements."
                      : "Toutes les notes sont synchronisées."}
                  </p>
                </div>
              </div>

              <button
                onClick={enregistrerToutSecondaire}
                disabled={
                  submittingSecondaire ||
                  nbNotesModifieesSecondaire === 0 ||
                  loadingNotesSecondaire
                }
                className={`${STYLES.button.primary} w-full bg-[#101B33] hover:bg-[#182746] sm:w-auto`}
              >
                <Save size={17} />
                {submittingSecondaire ? "Enregistrement..." : "Enregistrer les notes"}
              </button>

            </div>

          </div>

        </section>
      )}

      {/* ======================================================
          TOAST
      ====================================================== */}

      {toast && (
        <div className="fixed bottom-4 left-3 right-3 z-50 sm:left-auto sm:right-6 sm:max-w-md">
          <div className="flex items-start gap-3 rounded-2xl border border-[#2C8C82]/20 bg-[#101B33] px-4 py-3.5 text-sm font-medium text-white shadow-[0_16px_40px_rgba(16,27,51,0.25)]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#DCEDEA] text-[#2C8C82]">
              <CheckCircle size={15} />
            </span>
            <span className="pt-1">{toast}</span>
          </div>
        </div>
      )}

    </div>
  );
}