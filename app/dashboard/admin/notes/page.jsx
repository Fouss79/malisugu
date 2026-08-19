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
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

// ============================================================
// CONSTANTES
// ============================================================

const PERIODES = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

const STYLES = {
  input:
    "w-full rounded-xl border border-[#DEDCD0] bg-[#F8F7F2] px-3.5 py-3 text-sm font-medium text-[#1B2333] outline-none transition placeholder:text-[#8A91A2] hover:border-[#C8C5B8] focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/10 disabled:cursor-not-allowed disabled:opacity-60",
  card:
    "rounded-[20px] border border-[#DEDCD0] bg-white shadow-[0_10px_30px_rgba(16,27,51,0.05)]",
  button: {
    primary:
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    secondary:
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
  }
};

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

function Card({ title, description, children, className = "" }) {
  return (
    <div className={`${STYLES.card} ${className}`}>
      {title && (
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      )}
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

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
  // ÉTATS
  // ============================================================

  // Données
  const [donnees, setDonnees] = useState({
    classes: [],
    eleves: [],
    affectations: [],
    annees: []
  });

  // Notes
  const [notes, setNotes] = useState({
    saisies: {},
    existantes: {}
  });

  // États de contrôle
  const [etats, setEtats] = useState({
    loadingInitial: true,
    loadingEleves: false,
    loadingNotes: false,
    submitting: false,
    erreur: "",
    toast: null
  });

  // Filtres
  const [filtres, setFiltres] = useState({
    classeId: "",
    coefficientMatiereId: "",
    anneeScolaireId: "",
    periode: ""
  });

  // ============================================================
  // FONCTIONS
  // ============================================================

  const afficherToast = (message) => {
    setEtats(prev => ({ ...prev, toast: message }));
    setTimeout(() => setEtats(prev => ({ ...prev, toast: null })), 3000);
  };

  const afficherErreur = (message) => {
    setEtats(prev => ({ ...prev, erreur: message }));
  };

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    if (!user?.ecole?.id) return;

    const chargerDonneesInitiales = async () => {
      try {
        const ecoleId = user.ecole.id;
        const [classesRes, anneesRes] = await Promise.all([
          api.get(`/classes/ecole/${ecoleId}`),
          api.get(`/annees/ecole/${ecoleId}`)
        ]);

        const classes = Array.isArray(classesRes.data) ? classesRes.data : [];
        const annees = Array.isArray(anneesRes.data) ? anneesRes.data : [];

        setDonnees(prev => ({ ...prev, classes, annees }));

        // Sélection automatique de l'année active
        const anneeActive = annees.find(a => a.active);
        if (anneeActive) {
          setFiltres(prev => ({
            ...prev,
            anneeScolaireId: String(anneeActive.id)
          }));
        }
      } catch (error) {
        console.error("Erreur chargement initial:", error);
        afficherErreur("Impossible de charger les données initiales.");
      } finally {
        setEtats(prev => ({ ...prev, loadingInitial: false }));
      }
    };

    chargerDonneesInitiales();
  }, [user]);

  // ============================================================
  // CHARGEMENT DES AFFECTATIONS
  // ============================================================

  useEffect(() => {
    if (!filtres.classeId || !filtres.anneeScolaireId) {
      setDonnees(prev => ({ ...prev, affectations: [] }));
      return;
    }

    const chargerAffectations = async () => {
      try {
        const response = await api.get(
          `/affectations-enseignants/classe/${filtres.classeId}`,
          { params: { anneeScolaireId: Number(filtres.anneeScolaireId) } }
        );

        const affectations = Array.isArray(response.data) ? response.data : [];
        setDonnees(prev => ({ ...prev, affectations }));

        // Réinitialisation
        setFiltres(prev => ({ ...prev, coefficientMatiereId: "" }));
        setNotes({ saisies: {}, existantes: {} });
      } catch (error) {
        console.error("Erreur chargement affectations:", error);
        setDonnees(prev => ({ ...prev, affectations: [] }));
      }
    };

    chargerAffectations();
  }, [filtres.classeId, filtres.anneeScolaireId]);

  // ============================================================
  // CALCUL DES MATIÈRES DISPONIBLES
  // ============================================================

  const matieresDisponibles = useMemo(() => {
    const matieresMap = new Map();

    donnees.affectations.forEach(affectation => {
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
          sousGroupeNom: affectation.sousGroupeNom ?? null
        });
      }
    });

    return Array.from(matieresMap.values())
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [donnees.affectations]);

  // ============================================================
  // MATIÈRE SÉLECTIONNÉE
  // ============================================================

  const matiereChoisie = useMemo(() => {
    return matieresDisponibles.find(
      m => String(m.id) === String(filtres.coefficientMatiereId)
    );
  }, [matieresDisponibles, filtres.coefficientMatiereId]);

  const sousGroupeIdEffectif = matiereChoisie?.sousGroupeId ?? null;
  const sousGroupeNomEffectif = matiereChoisie?.sousGroupeNom ?? null;

  // ============================================================
  // CHARGEMENT DES ÉLÈVES
  // ============================================================

  useEffect(() => {
    if (!filtres.classeId || !filtres.anneeScolaireId) {
      setDonnees(prev => ({ ...prev, eleves: [] }));
      return;
    }

    const chargerEleves = async () => {
      setEtats(prev => ({ ...prev, loadingEleves: true }));

      try {
        let url;
        if (sousGroupeIdEffectif) {
          url = `/sous-groupes/${sousGroupeIdEffectif}/eleves-annee-active`;
        } else {
          url = `/inscriptions/actif/classe/${filtres.classeId}/annee/${filtres.anneeScolaireId}`;
        }

        const response = await api.get(url);
        const eleves = Array.isArray(response.data) ? response.data : [];

        const elevesTries = [...eleves].sort((a, b) => {
          const nomA = `${a.nom ?? ""} ${a.prenom ?? ""}`.trim();
          const nomB = `${b.nom ?? ""} ${b.prenom ?? ""}`.trim();
          return nomA.localeCompare(nomB);
        });

        setDonnees(prev => ({ ...prev, eleves: elevesTries }));
      } catch (error) {
        console.error("Erreur chargement élèves:", error);
        setDonnees(prev => ({ ...prev, eleves: [] }));
      } finally {
        setEtats(prev => ({ ...prev, loadingEleves: false }));
      }
    };

    chargerEleves();
  }, [filtres.classeId, filtres.anneeScolaireId, sousGroupeIdEffectif]);

  // ============================================================
  // CHARGEMENT DES NOTES EXISTANTES
  // ============================================================

  const chargerNotesExistantes = useCallback(async () => {
    const { classeId, coefficientMatiereId, periode, anneeScolaireId } = filtres;

    if (!classeId || !coefficientMatiereId || !periode || !anneeScolaireId) {
      setNotes({ saisies: {}, existantes: {} });
      return;
    }

    setEtats(prev => ({ ...prev, loadingNotes: true }));

    try {
      const params = {
        classeId: Number(classeId),
        coefficientMatiereId: Number(coefficientMatiereId),
        periode,
        anneeScolaireId: Number(anneeScolaireId)
      };

      if (sousGroupeIdEffectif) {
        params.sousGroupeId = Number(sousGroupeIdEffectif);
      }

      const response = await api.get("/notes/classe", { params });
      const notesListe = Array.isArray(response.data) ? response.data : [];

      const notesMap = {};
      notesListe.forEach(note => {
        if (!note.inscriptionId) return;
        notesMap[String(note.inscriptionId)] = {
          id: note.id,
          nClass: note.nClass ?? note.nclass ?? "",
          nExem: note.nExem ?? note.nexem ?? ""
        };
      });

      setNotes({ saisies: notesMap, existantes: notesMap });
    } catch (error) {
      console.error("Erreur chargement notes:", error);
      setNotes({ saisies: {}, existantes: {} });
    } finally {
      setEtats(prev => ({ ...prev, loadingNotes: false }));
    }
  }, [filtres, sousGroupeIdEffectif]);

  useEffect(() => {
    chargerNotesExistantes();
  }, [chargerNotesExistantes]);

  // ============================================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ============================================================

  const handleFiltreChange = (e) => {
    const { name, value } = e.target;

    setFiltres(prev => ({
      ...prev,
      [name]: value,
      ...(name === "classeId" && { coefficientMatiereId: "" })
    }));

    setEtats(prev => ({ ...prev, erreur: "" }));

    if (name === "coefficientMatiereId") {
      setNotes({ saisies: {}, existantes: {} });
    }
  };

  const handleNoteChange = (inscriptionId, champ, valeur) => {
    // Validation
    if (valeur !== "" && (Number(valeur) < 0 || Number(valeur) > 20)) {
      return;
    }

    setNotes(prev => ({
      ...prev,
      saisies: {
        ...prev.saisies,
        [String(inscriptionId)]: {
          ...(prev.saisies[String(inscriptionId)] || {}),
          [champ]: valeur
        }
      }
    }));
  };

  // ============================================================
  // CALCULS
  // ============================================================

  const calculerMoyenne = (note) => {
    if (!note || note.nClass === "" || note.nClass == null ||
        note.nExem === "" || note.nExem == null) {
      return null;
    }

    const nClass = Number(note.nClass);
    const nExem = Number(note.nExem);

    if (isNaN(nClass) || isNaN(nExem)) return null;

    return (nClass + nExem * 2) / 3;
  };

  const getMoyenneColor = (moyenne) => {
    if (moyenne === null) return "text-slate-300";
    if (moyenne < 10) return "text-rose-600";
    if (moyenne < 12) return "text-amber-600";
    return "text-emerald-600";
  };

  const nbNotesModifiees = useMemo(() => {
    return Object.keys(notes.saisies).filter(id => {
      const actuel = notes.saisies[id];
      const original = notes.existantes[id];

      if (!actuel) return false;
      if (actuel.nClass === "" && actuel.nExem === "") return false;
      if (!original) return true;

      return String(actuel.nClass ?? "") !== String(original.nClass ?? "") ||
             String(actuel.nExem ?? "") !== String(original.nExem ?? "");
    }).length;
  }, [notes.saisies, notes.existantes]);

  const getTexteNotesModifiees = () => {
    if (nbNotesModifiees === 0) return "Aucune modification en attente";
    if (nbNotesModifiees === 1) return "1 note modifiée non enregistrée";
    return `${nbNotesModifiees} notes modifiées non enregistrées`;
  };

  // ============================================================
  // ENREGISTREMENT
  // ============================================================

  const enregistrerTout = async () => {
    setEtats(prev => ({ ...prev, erreur: "" }));

    // Validations
    if (!filtres.classeId || !filtres.coefficientMatiereId ||
        !filtres.anneeScolaireId || !filtres.periode) {
      afficherErreur(
        "Choisissez la classe, la matière, l'année et la période avant d'enregistrer."
      );
      return;
    }

    if (donnees.eleves.length === 0) {
      afficherErreur("Aucun élève à enregistrer.");
      return;
    }

    // Construction du payload
    const notesAEnvoyer = donnees.eleves
      .map(eleve => {
        const note = notes.saisies[String(eleve.id)] || {};
        if (!note.nClass || !note.nExem || note.nClass === "" || note.nExem === "") {
          return null;
        }
        return {
          inscriptionId: eleve.id,
          nClass: Number(note.nClass),
          nExem: Number(note.nExem)
        };
      })
      .filter(Boolean);

    if (notesAEnvoyer.length === 0) {
      afficherErreur("Saisissez au moins une note complète avant d'enregistrer.");
      return;
    }

    const payload = {
      classeId: Number(filtres.classeId),
      coefficientMatiereId: Number(filtres.coefficientMatiereId),
      sousGroupeId: sousGroupeIdEffectif ? Number(sousGroupeIdEffectif) : null,
      periode: filtres.periode,
      notes: notesAEnvoyer
    };

    setEtats(prev => ({ ...prev, submitting: true }));

    try {
      await api.post("/notes/en-masse", payload);
      afficherToast(`✓ ${notesAEnvoyer.length} note(s) enregistrée(s)`);
      await chargerNotesExistantes();
    } catch (error) {
      console.error("Erreur enregistrement:", error);
      afficherErreur(
        error.response?.data?.message ||
        error.response?.data ||
        "Erreur lors de l'enregistrement."
      );
    } finally {
      setEtats(prev => ({ ...prev, submitting: false }));
    }
  };

  // ============================================================
  // TÉLÉCHARGEMENT DES BULLETINS
  // ============================================================

  const downloadBulletinClasse = async () => {
    setEtats(prev => ({ ...prev, erreur: "" }));

    if (!filtres.classeId || !filtres.anneeScolaireId || !filtres.periode) {
      afficherErreur(
        "Choisissez la classe, l'année et la période avant de générer les bulletins."
      );
      return;
    }

    try {
      const response = await api.get("/bulletins/generate-classe", {
        params: {
          classeId: filtres.classeId,
          anneeId: filtres.anneeScolaireId,
          periode: filtres.periode,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "bulletins-classe.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur bulletin:", error);
      afficherErreur("Erreur lors de la génération des bulletins.");
    }
  };


  // ============================================================
  // RENDU
  // ============================================================

  if (etats.loadingInitial) {
    return <LoadingSpinner />;
  }

  const notesCompletes = donnees.eleves.filter((eleve) => {
    const note = notes.saisies[String(eleve.id)] || {};
    return note.nClass !== "" && note.nClass != null &&
      note.nExem !== "" && note.nExem != null;
  }).length;

  return (
    <div className="min-h-full space-y-5 bg-[#ECEAE2] p-3 sm:p-5 lg:p-6">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <section className="overflow-hidden rounded-[22px] bg-[#101B33] shadow-[0_14px_35px_rgba(16,27,51,0.14)]">
        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#C89B3C]/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-[#2C8C82]/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#E4B655]">
                <BookOpen size={14} />
                Gestion pédagogique
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Saisie des notes
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                Saisissez les notes de classe et d&apos;examen. Le programme,
                le coefficient et le sous-groupe sont automatiquement liés à
                la classe sélectionnée.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Users size={14} />
                  Élèves
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-white">
                  {donnees.eleves.length}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle size={14} />
                  Complètes
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-[#E4B655]">
                  {notesCompletes}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ERREUR
      ===================================================== */}
      {etats.erreur && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#D2593F]/20 bg-[#F7E2DB] px-4 py-3.5 text-sm text-[#9D3929] shadow-sm">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span className="leading-5">{etats.erreur}</span>
        </div>
      )}

      {/* =====================================================
          FILTRES
      ===================================================== */}
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
                Choisissez la classe, l&apos;année, la matière et la période.
              </p>
            </div>

            {matiereChoisie && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#DCEDEA] px-3 py-1.5 text-xs font-semibold text-[#236F68]">
                <CheckCircle size={14} />
                Programme sélectionné
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                Classe
              </span>
              <select
                name="classeId"
                value={filtres.classeId}
                onChange={handleFiltreChange}
                className={STYLES.input}
              >
                <option value="">Sélectionner une classe</option>
                {donnees.classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nomComplet}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                Année scolaire
              </span>
              <select
                name="anneeScolaireId"
                value={filtres.anneeScolaireId}
                onChange={handleFiltreChange}
                className={STYLES.input}
              >
                <option value="">Sélectionner l&apos;année</option>
                {donnees.annees.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.nom} {annee.active ? "— Active" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                Matière / programme
              </span>
              <select
                name="coefficientMatiereId"
                value={filtres.coefficientMatiereId}
                onChange={handleFiltreChange}
                disabled={!filtres.classeId || matieresDisponibles.length === 0}
                className={STYLES.input}
              >
                <option value="">
                  {!filtres.classeId
                    ? "Choisissez d'abord une classe"
                    : matieresDisponibles.length === 0
                      ? "Aucune matière disponible"
                      : "Sélectionner une matière"}
                </option>

                {matieresDisponibles.map((matiere) => (
                  <option key={matiere.id} value={matiere.id}>
                    {matiere.nom} — Coef. {matiere.coeff}
                    {matiere.sousGroupeNom ? ` — ${matiere.sousGroupeNom}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#7A8190]">
                Période
              </span>
              <select
                name="periode"
                value={filtres.periode}
                onChange={handleFiltreChange}
                className={STYLES.input}
              >
                <option value="">Sélectionner la période</option>
                {PERIODES.map((periode) => (
                  <option key={periode} value={periode}>
                    {periode}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Informations du programme */}
          {matiereChoisie && (
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

              <div className="grid grid-cols-2 divide-x divide-y divide-[#DEDCD0] sm:grid-cols-4 sm:divide-y-0">
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
                      sousGroupeNomEffectif
                        ? "text-[#6E5DC6]"
                        : "text-[#2C8C82]"
                    }`}
                  >
                    {sousGroupeNomEffectif || "Toute la classe"}
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium text-[#7A8190]">Élèves</p>
                  <p className="mt-1 font-mono text-lg font-bold text-[#101B33]">
                    {donnees.eleves.length}
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

          {filtres.classeId && !donnees.affectations.length && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E4B655]/30 bg-[#FFF7DF] px-3.5 py-3 text-sm text-[#8A6818]">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>
                Aucun programme ou aucune affectation trouvée pour cette classe
                et cette année scolaire.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          ACTIONS
      ===================================================== */}
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
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
          onClick={downloadBulletinClasse}
          disabled={!filtres.classeId || !filtres.anneeScolaireId || !filtres.periode}
          className={`${STYLES.button.primary} bg-[#C89B3C] shadow-sm hover:bg-[#B68931]`}
        >
          <Download size={17} />
          Télécharger les bulletins
        </button>
      </div>

      {/* =====================================================
          TABLEAU DES NOTES
      ===================================================== */}
      {filtres.classeId && filtres.coefficientMatiereId && filtres.periode && (
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
                        : "Toute la classe"}{" "}
                      · {donnees.eleves.length} élève
                      {donnees.eleves.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#DCEDEA] px-3 py-1.5 text-xs font-bold text-[#236F68]">
                  {notesCompletes}/{donnees.eleves.length} complètes
                </span>
                {nbNotesModifiees > 0 && (
                  <span className="rounded-full bg-[#F7E2DB] px-3 py-1.5 text-xs font-bold text-[#9D3929]">
                    {nbNotesModifiees} modif.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            {/* MOBILE : cartes élèves */}
            <div className="space-y-3 lg:hidden">
              {(etats.loadingEleves || etats.loadingNotes) && (
                <div className="rounded-2xl border border-[#DEDCD0] bg-[#F8F7F2] px-4 py-10 text-center">
                  <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
                  <p className="text-sm font-medium text-[#7A8190]">
                    Chargement des notes...
                  </p>
                </div>
              )}

              {!etats.loadingEleves &&
                !etats.loadingNotes &&
                donnees.eleves.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#DEDCD0] bg-[#F8F7F2] px-4 py-10 text-center">
                    <Users className="mx-auto mb-3 text-[#9BA2B1]" size={28} />
                    <p className="text-sm font-semibold text-[#5B6478]">
                      {sousGroupeIdEffectif
                        ? `Aucun élève dans le sous-groupe « ${sousGroupeNomEffectif} ».`
                        : "Aucun élève dans cette classe."}
                    </p>
                  </div>
                )}

              {!etats.loadingEleves &&
                !etats.loadingNotes &&
                donnees.eleves.map((eleve, index) => {
                  const note = notes.saisies[String(eleve.id)] || {};
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
                            className={`font-mono text-lg font-bold ${getMoyenneColor(
                              moyenne
                            )}`}
                          >
                            {moyenne !== null ? moyenne.toFixed(2) : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="rounded-xl bg-[#F8F7F2] p-2.5">
                          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#7A8190]">
                            Note classe /20
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            max="20"
                            value={note.nClass ?? ""}
                            onChange={(e) =>
                              handleNoteChange(
                                eleve.id,
                                "nClass",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-[#DEDCD0] bg-white px-2.5 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                          />
                        </label>

                        <label className="rounded-xl bg-[#F8F7F2] p-2.5">
                          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#7A8190]">
                            Note examen /20
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            max="20"
                            value={note.nExem ?? ""}
                            onChange={(e) =>
                              handleNoteChange(
                                eleve.id,
                                "nExem",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-[#DEDCD0] bg-white px-2.5 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none transition focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* DESKTOP : tableau */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DEDCD0] bg-[#F8F7F2] text-[10px] uppercase tracking-[0.12em] text-[#7A8190]">
                    <th className="rounded-l-xl px-4 py-3.5 font-bold">#</th>
                    <th className="px-4 py-3.5 font-bold">Élève</th>
                    <th className="px-4 py-3.5 text-center font-bold">
                      Note classe /20
                    </th>
                    <th className="px-4 py-3.5 text-center font-bold">
                      Note examen /20
                    </th>
                    <th className="rounded-r-xl px-4 py-3.5 text-center font-bold">
                      Moyenne
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {(etats.loadingEleves || etats.loadingNotes) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center">
                        <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-[#C89B3C] border-t-transparent" />
                        <span className="text-sm font-medium text-[#7A8190]">
                          Chargement des notes...
                        </span>
                      </td>
                    </tr>
                  )}

                  {!etats.loadingEleves &&
                    !etats.loadingNotes &&
                    donnees.eleves.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-14 text-center">
                          <Users
                            className="mx-auto mb-3 text-[#9BA2B1]"
                            size={28}
                          />
                          <p className="text-sm font-semibold text-[#5B6478]">
                            {sousGroupeIdEffectif
                              ? `Aucun élève dans le sous-groupe « ${sousGroupeNomEffectif} ».`
                              : "Aucun élève dans cette classe."}
                          </p>
                        </td>
                      </tr>
                    )}

                  {!etats.loadingEleves &&
                    !etats.loadingNotes &&
                    donnees.eleves.map((eleve, index) => {
                      const note = notes.saisies[String(eleve.id)] || {};
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
                              max="20"
                              value={note.nClass ?? ""}
                              onChange={(e) =>
                                handleNoteChange(
                                  eleve.id,
                                  "nClass",
                                  e.target.value
                                )
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
                              max="20"
                              value={note.nExem ?? ""}
                              onChange={(e) =>
                                handleNoteChange(
                                  eleve.id,
                                  "nExem",
                                  e.target.value
                                )
                              }
                              className="w-24 rounded-xl border border-[#DEDCD0] bg-white px-2.5 py-2.5 text-center font-mono text-sm font-bold text-[#101B33] outline-none transition hover:border-[#C8C5B8] focus:border-[#C89B3C] focus:ring-4 focus:ring-[#C89B3C]/10"
                            />
                          </td>

                          <td
                            className={`px-4 py-4 text-center font-mono text-base font-bold ${getMoyenneColor(
                              moyenne
                            )}`}
                          >
                            {moyenne !== null ? moyenne.toFixed(2) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* FOOTER ENREGISTREMENT */}
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#DEDCD0] bg-[#F8F7F2] p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    nbNotesModifiees > 0
                      ? "bg-[#F7E2DB] text-[#D2593F]"
                      : "bg-[#DCEDEA] text-[#2C8C82]"
                  }`}
                >
                  {nbNotesModifiees > 0 ? (
                    <Clock size={17} />
                  ) : (
                    <CheckCircle size={17} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#101B33]">
                    {getTexteNotesModifiees()}
                  </p>
                  <p className="mt-0.5 text-xs text-[#7A8190]">
                    {nbNotesModifiees > 0
                      ? "Enregistrez pour appliquer les changements."
                      : "Toutes les notes sont synchronisées."}
                  </p>
                </div>
              </div>

              <button
                onClick={enregistrerTout}
                disabled={
                  etats.submitting ||
                  nbNotesModifiees === 0 ||
                  etats.loadingNotes
                }
                className={`${STYLES.button.primary} w-full bg-[#101B33] hover:bg-[#182746] sm:w-auto`}
              >
                <Save size={17} />
                {etats.submitting
                  ? "Enregistrement..."
                  : "Enregistrer les notes"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          TOAST
      ===================================================== */}
      {etats.toast && (
        <div className="fixed bottom-4 left-3 right-3 z-50 sm:left-auto sm:right-6 sm:max-w-md">
          <div className="flex items-start gap-3 rounded-2xl border border-[#2C8C82]/20 bg-[#101B33] px-4 py-3.5 text-sm font-medium text-white shadow-[0_16px_40px_rgba(16,27,51,0.25)]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#DCEDEA] text-[#2C8C82]">
              <CheckCircle size={15} />
            </span>
            <span className="pt-1">{etats.toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}